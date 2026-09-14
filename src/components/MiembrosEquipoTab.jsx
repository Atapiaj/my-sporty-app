import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getMiembrosEquipoService, updateMiembroEquipoRolService, deleteMiembroEquipoService } from "../services/equipoService";

const ROL_ICONS = {
  jugador: "person-outline",
  capitan: "star-outline",
  suplente: "time-outline",
  entrenador: "fitness-outline",
  arbitro: "flag-outline",
};

const ROL_COLORS = {
  jugador: "#6366f1",
  capitan: "#f59e0b",
  suplente: "#10b981",
  entrenador: "#10b981",
  arbitro: "#ef4444",
};

export default function MiembrosEquipoTab({ equipo, equipoId, isOwner, scrollEnabled = true, isDarkMode }) {
  const navigation = useNavigation();
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [filtroRol, setFiltroRol] = useState("todos");
  const rolesDisponibles = ["todos", "capitan", "jugador", "suplente"];

  const propietarioId = equipo?.propietario_id;

  useEffect(() => {
    fetchMiembros();
  }, [equipoId]);

  const fetchMiembros = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMiembrosEquipoService(equipoId);
      if (res?.status === 200 && res?.data?.miembros) {
        setMiembros(res.data.miembros);
      } else {
        setMiembros([]);
      }
    } catch (err) {
      console.error("Error cargando miembros:", err);
      setError("No se pudieron cargar los miembros.");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (rol) => {
    if (!selectedMember) return;
    try {
      setUpdatingRole(true);
      await updateMiembroEquipoRolService(selectedMember.usuario_id, equipoId, rol);
      setModalVisible(false);
      setSelectedMember(null);
      await fetchMiembros();
    } catch (err) {
      console.error("Error cambiando rol:", err);
      alert("Error al cambiar el rol. Intenta de nuevo.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleEliminarMiembro = () => {
    if (!selectedMember) return;
    Alert.alert(
      "Eliminar Miembro",
      `¿Estás seguro de que quieres eliminar a ${selectedMember.usuario_nombre} del equipo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingRole(true);
              await deleteMiembroEquipoService(selectedMember.usuario_id, equipoId);
              setModalVisible(false);
              setSelectedMember(null);
              await fetchMiembros();
            } catch (err) {
              console.error("Error eliminando miembro:", err);
              Alert.alert("Error", "No se pudo eliminar al miembro. Intenta de nuevo.");
            } finally {
              setUpdatingRole(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 12 }}>{error}</Text>
      </View>
    );
  }

  if (miembros.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Ionicons name="people-outline" size={48} color="#d1d5db" />
        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 16, fontStyle: "italic" }}>
          Este equipo aún no tiene miembros registrados.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
    >
      {/* Encabezado conteo y filtros */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{
            backgroundColor: "#eef2ff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}>
            <Ionicons name="people" size={16} color="#4f46e5" />
            <Text style={{ color: "#4f46e5", fontWeight: "700", fontSize: 13 }}>
              {miembros.length} miembro{miembros.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {rolesDisponibles.map(rol => {
            const isActive = filtroRol === rol;
            return (
              <TouchableOpacity
                key={rol}
                onPress={() => setFiltroRol(rol)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: isActive ? "#4f46e5" : isDarkMode ? "#262626" : "#f3f4f6",
                  borderWidth: 1, borderColor: isActive ? "#4f46e5" : isDarkMode ? "#404040" : "#e5e7eb",
                }}
              >
                <Text style={{
                  color: isActive ? "#ffffff" : isDarkMode ? "#e5e7eb" : "#4b5563",
                  fontSize: 12, fontWeight: "600", textTransform: "capitalize"
                }}>
                  {rol}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {miembros
        .filter(m => filtroRol === "todos" || (m.rol_usuario || "jugador") === filtroRol)
        .map((m) => {
          const esCreador = m.usuario_id === propietarioId;
          const rol = m.rol_usuario || "jugador";
          const color = ROL_COLORS[rol] || "#6366f1";
          const icon = ROL_ICONS[rol] || "person-outline";
          const iniciales = (m.usuario_nombre || "?")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => {
                navigation.push('MiembroPerfil', {
                  usuarioPerfil: {
                    id: m.usuario_id,
                    nombre: m.usuario_nombre,
                    correo: m.correo,
                    rol: m.rol_usuario
                  }
                });
              }}
              style={{
                backgroundColor: isDarkMode ? "#262626" : "white",
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {/* Avatar */}
              <View style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: color + "22",
                alignItems: "center", justifyContent: "center",
                marginRight: 14,
              }}>
                <Text style={{ color, fontWeight: "800", fontSize: 16 }}>{iniciales}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: isDarkMode ? "#6366f1" : "#111827" }}>
                    {m.usuario_nombre || "Sin nombre"}
                  </Text>
                  {esCreador && (
                    <View style={{
                      backgroundColor: "#fef3c7", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
                      flexDirection: "row", alignItems: "center", gap: 4,
                    }}>
                      <Ionicons name="shield-checkmark" size={11} color="#d97706" />
                      <Text style={{ color: "#d97706", fontSize: 10, fontWeight: "800" }}>Creador</Text>
                    </View>
                  )}
                </View>
                {m.correo && (
                  <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{m.correo}</Text>
                )}
              </View>

              {/* Rol badge */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: color + "15", borderRadius: 12,
                  paddingHorizontal: 10, paddingVertical: 6, gap: 2,
                  marginRight: isOwner && !esCreador ? 8 : 0,
                }}>
                  <Ionicons name={icon} size={16} color={color} />
                  <Text style={{ color, fontSize: 9, fontWeight: "700", textTransform: "uppercase" }}>
                    {rol}
                  </Text>
                </View>
                {isOwner && !esCreador && (
                  <TouchableOpacity
                    style={{ padding: 6, backgroundColor: isDarkMode ? "#262626" : '#f3f4f6', borderRadius: 8 }}
                    onPress={() => {
                      setSelectedMember(m);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color={isDarkMode ? "#e5e7eb" : "#6b7280"} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

      {/* Modal para opciones del miembro */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: isDarkMode ? "#171717" : "white", borderRadius: 16, width: "100%", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16, textAlign: "center", color: isDarkMode ? "white" : "black" }}>
              Opciones para {selectedMember?.usuario_nombre}
            </Text>

            {updatingRole ? (
              <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <Text style={{ fontSize: 14, color: isDarkMode ? "#9ca3af" : "#6b7280", marginBottom: 8, fontWeight: "600", marginLeft: 4 }}>Cambiar rol</Text>
                {["jugador", "capitan", "suplente"].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", flexDirection: "row", alignItems: "center" }}
                    onPress={() => handleCambiarRol(role)}
                  >
                    <Ionicons name={ROL_ICONS[role] || "person-outline"} size={20} color={ROL_COLORS[role] || "#6366f1"} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, textTransform: "capitalize", color: isDarkMode ? "#9ca3af" : "#374151", fontWeight: "600" }}>{role}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={{ marginTop: 16, padding: 14, backgroundColor: "#fee2e2", borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
                  onPress={handleEliminarMiembro}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                  <Text style={{ fontWeight: "600", color: "#ef4444" }}>Eliminar del equipo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, padding: 14, backgroundColor: isDarkMode ? "#262626" : "#f3f4f6", borderRadius: 8, alignItems: "center" }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ fontWeight: "600", color: isDarkMode ? "#9ca3af" : "#4b5563" }}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
