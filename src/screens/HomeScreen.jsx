import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { CampeonatoContext } from "../context/CampeonatoContext";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import EventCard from "../components/EventCard";
import SkeletonCard from "../components/SkeletonCard";
import { getEquiposService } from "../services/equipoService";
import { enviarSolicitudUnionService } from "../services/notificacionService";

const STATUS_OPTIONS = [
  { label: "Todos", value: "todos" },
  { label: "Activos", value: "activo" },
  { label: "Programados", value: "programado" },
  { label: "Finalizados", value: "finalizado" },
];

export default function HomeScreen({ navigation }) {
  const { campeonatosPublicos, loading, refreshCampeonatosPublicos } = useContext(CampeonatoContext);
  const { usuario } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [filterStatus, setFilterStatus] = useState("todos");
  // Join request modal states
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedCampeonato, setSelectedCampeonato] = useState(null);
  const [misEquipos, setMisEquipos] = useState([]);
  const [selectedEquipoId, setSelectedEquipoId] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshCampeonatosPublicos();
    }, [])
  );

  const filteredList = (campeonatosPublicos || []).filter((c) => {
    if (filterStatus === "todos") return true;
    return c.estado === filterStatus;
  });

  

  const handleOpenJoin = async (campeonato) => {
    setSelectedCampeonato(campeonato);
    setSelectedEquipoId(null);
    setJoinLoading(true);
    setJoinModalVisible(true);
    try {
      const res = await getEquiposService();
      const equipos = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      // Filter teams by sport
      const matchingTeams = equipos.filter(e => e.deporte === campeonato.deporte);
      setMisEquipos(matchingTeams);
    } catch (e) {
      setMisEquipos([]);
    }
    setJoinLoading(false);
  };

  const handleConfirmJoin = async () => {
    if (!selectedEquipoId) {
      Alert.alert("Selecciona un equipo", "Debes escoger un equipo para enviar la solicitud.");
      return;
    }
    try {
      setJoinLoading(true);
      await enviarSolicitudUnionService(selectedCampeonato.id, selectedEquipoId);
      setJoinModalVisible(false);
      Alert.alert("✅ Solicitud enviada", "El creador del campeonato recibirá tu solicitud y podrá aceptarla.");
    } catch (e) {
      const msg = e?.response?.data?.message || "No se pudo enviar la solicitud.";
      Alert.alert("Error", msg);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}>

 
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                borderWidth: 1,
                backgroundColor: filterStatus === opt.value ? '#4f46e5' : isDarkMode ? "#171717": "#ffffff",
                borderColor: filterStatus === opt.value ? '#4f46e5' : '#eaeaea',
              }}
              onPress={() => setFilterStatus(opt.value)}
            >
              <Text
                className={`text-[12px] font-semibold ${
                  filterStatus === opt.value ? "text-white" : "text-gray-600 dark:text-white"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
  <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
>
        {loading ? (
          <View className="pt-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View>
          {filteredList.map((item) => (
             <EventCard
                evento={item}
                key={item.id}
                onPress={() => navigation.navigate('FasesCampeonatoScreen', {
                  campeonato: item,
                  readOnly: true,
                })}
                showJoinButton={
                  (item.inscripciones_abiertas === 1 || item.inscripciones_abiertas === '1') &&
                  !!usuario &&
                  item.propietario_id !== usuario.id &&
                  !item.solicitud_pendiente_id &&
                  !item.equipo_inscrito_nombre
                }
                onJoin={() => handleOpenJoin(item)}
              />
          ))}
          </View>
        )}
      </ScrollView>

      {/* Join Request Modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setJoinModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white dark:bg-neutral-800 rounded-t-3xl px-5 pt-5 pb-10">
              <View className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full self-center mb-4" />
              <Text className="text-base font-bold text-[#1a1a1a] dark:text-white mb-1">
                Unirse a {selectedCampeonato?.nombre}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
                Selecciona el equipo con el que deseas participar:
              </Text>

              {joinLoading ? (
                <ActivityIndicator color="#4f46e5" className="my-6" />
              ) : misEquipos.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons name="shield-outline" size={36} color="#aaa" />
                  <Text className="text-sm text-gray-500 dark:text-neutral-400 mt-2 text-center">
                    No tienes equipos. Crea uno primero en la sección Equipos.
                  </Text>
                </View>
              ) : (
                misEquipos.map((equipo) => (
                  <TouchableOpacity
                    key={equipo.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      padding: 16, borderRadius: 12, marginBottom: 8,
                      borderWidth: 1,
                      borderColor: selectedEquipoId === equipo.id ? '#4f46e5' : (isDarkMode ? '#374151' : '#eaeaea'),
                      backgroundColor: selectedEquipoId === equipo.id
                        ? (isDarkMode ? '#312e81' : '#eef2ff')
                        : (isDarkMode ? '#262626' : '#ffffff'),
                    }}
                    onPress={() => setSelectedEquipoId(equipo.id)}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                        selectedEquipoId === equipo.id ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                      }`}
                    >
                      {selectedEquipoId === equipo.id && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </View>
                    <Text className="text-sm font-semibold text-[#1a1a1a] dark:text-white">{equipo.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}

              {misEquipos.length > 0 && (
                <TouchableOpacity
                  style={{
                    marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    backgroundColor: selectedEquipoId ? '#4f46e5' : '#d1d5db',
                  }}
                  onPress={handleConfirmJoin}
                  disabled={!selectedEquipoId || joinLoading}
                >
                  {joinLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-sm">Enviar Solicitud</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
