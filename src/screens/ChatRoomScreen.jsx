import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import {
  getHistorialAmigoService,
  getHistorialEquipoService,
  getHistorialCampeonatoService,
  getChatMembersService,
} from "../services/mensajeService";
import API_BASE_URL from "../config/apiConfig";

export default function ChatRoomScreen({ route, navigation }) {
  const { type, target } = route.params; // type: 'amigo' | 'equipo', target: Object
  const { isDarkMode } = useContext(ThemeContext);
  const { socket, conectado } = useContext(SocketContext);
  const { usuario } = useContext(AuthContext);

  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [miembros, setMiembros] = useState([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const flatListRef = useRef(null);

  const { marcarAmigoLeido, marcarEquipoLeido, marcarCampeonatoLeido } = useContext(ChatContext);
  const { setActiveChat } = useContext(SocketContext);

  useEffect(() => {
    // Establecer este chat como activo para suprimir notificaciones locales redundantes
    setActiveChat({ type, id: target.id });
    return () => setActiveChat(null);
  }, [type, target.id, setActiveChat]);

  useEffect(() => {
    if (type === "amigo") {
      marcarAmigoLeido(target.id);
    } else if (type === "equipo") {
      marcarEquipoLeido(target.id);
    } else if (type === "campeonato") {
      marcarCampeonatoLeido(target.id);
    }
  }, [type, target.id, marcarAmigoLeido, marcarEquipoLeido, marcarCampeonatoLeido]);

  useEffect(() => {
    // Si llegan nuevos mensajes estando en pantalla, los marcamos como leídos instantáneamente
    if (mensajes.length > 0) {
      if (type === "amigo") {
        marcarAmigoLeido(target.id);
      } else if (type === "equipo") {
        marcarEquipoLeido(target.id);
      } else if (type === "campeonato") {
        marcarCampeonatoLeido(target.id);
      }
    }
  }, [mensajes.length, type, target.id, marcarAmigoLeido, marcarEquipoLeido, marcarCampeonatoLeido]);

  useEffect(() => {
    cargarHistorial();

    if (socket) {
      const receiveEvent =
        type === "amigo" ? "receive_message_amigo" : type === "equipo" ? "receive_message_equipo" : "receive_message_campeonato";

      const handleNewMessage = (msg) => {
        // Filtrar si el mensaje es de este chat específico
        if (type === "amigo") {
          if (
            (msg.emisor_id === target.id && msg.receptor_id === usuario.id) ||
            (msg.emisor_id === usuario.id && msg.receptor_id === target.id)
          ) {
            setMensajes((prev) => [msg, ...prev]);
          }
        } else if (type === "equipo") {
          if (Number(msg.equipo_id) === Number(target.id)) {
            setMensajes((prev) => [msg, ...prev]);
          }
        } else if (type === "campeonato") {
          if (Number(msg.campeonato_id) === Number(target.id)) {
            setMensajes((prev) => [msg, ...prev]);
          }
        }
      };

      socket.on(receiveEvent, handleNewMessage);

      return () => {
        socket.off(receiveEvent, handleNewMessage);
      };
    }
  }, [socket, type, target.id]);

  const cargarHistorial = async (pageNumber = 1) => {
    try {
      if (pageNumber > 1) setIsLoadingMore(true);

      let res;
      if (type === "amigo") {
        res = await getHistorialAmigoService(target.id, pageNumber);
      } else if (type === "equipo") {
        res = await getHistorialEquipoService(target.id, pageNumber);
      } else {
        res = await getHistorialCampeonatoService(target.id, pageNumber);
      }

      if (!res.error && res.data) {
        if (pageNumber === 1) {
          setMensajes(res.data);
        } else {
          setMensajes((prev) => [...prev, ...res.data]);
        }

        if (res.data.length < 30) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const cargarMiembros = async () => {
    if (type === 'amigo') return;
    setLoadingMiembros(true);
    try {
      const res = await getChatMembersService(type, target.id);
      if (!res.error && res.data) {
        setMiembros(res.data);
      }
    } catch (error) {
      console.error('Error al cargar miembros del chat:', error);
    } finally {
      setLoadingMiembros(false);
    }
  };

  useEffect(() => {
    if (type !== 'amigo') {
      cargarMiembros();
    }
  }, [type, target.id]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      cargarHistorial(nextPage);
    }
  };

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !socket) return;

    if (type === "amigo") {
      socket.emit("send_message_amigo", {
        receptor_id: target.id,
        mensaje: nuevoMensaje.trim(),
      });
    } else if (type === "equipo") {
      socket.emit("send_message_equipo", {
        equipo_id: target.id,
        mensaje: nuevoMensaje.trim(),
      });
    } else if (type === "campeonato") {
      socket.emit("send_message_campeonato", {
        campeonato_id: target.id,
        mensaje: nuevoMensaje.trim(),
      });
    }

    setNuevoMensaje("");
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const formatDateSeparator = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) {
      return "Hoy";
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return "Ayer";
    } else if (msgDate.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
    } else {
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const renderMensaje = ({ item, index }) => {
    // Verificar si es mío
    const isMine = item.emisor_id === usuario.id;

    // Verificar si debemos mostrar el separador de fecha arriba del mensaje
    // En FlatList inverted, mensajes[index + 1] es el mensaje previo (más antiguo).
    const prevMsg = mensajes[index + 1];
    const showDateSeparator =
      item.fecha_envio &&
      (!prevMsg || !prevMsg.fecha_envio || !isSameDay(item.fecha_envio, prevMsg.fecha_envio));

    return (
      <View style={{ width: "100%" }}>
        {showDateSeparator && (
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <View
              style={{
                backgroundColor: isDarkMode ? "#262626" : "#e5e7eb",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 12,
                elevation: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDarkMode ? "#d4d4d4" : "#4b5563",
                }}
              >
                {formatDateSeparator(item.fecha_envio)}
              </Text>
            </View>
          </View>
        )}

        <View
          style={{
            alignSelf: isMine ? "flex-end" : "flex-start",
            maxWidth: "80%",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 6,
            borderRadius: 16,
            marginBottom: 8,
            backgroundColor: isMine
              ? "#4f46e5"
              : isDarkMode
                ? "#262626"
                : "#ffffff",
            borderBottomRightRadius: isMine ? 0 : 16,
            borderBottomLeftRadius: isMine ? 16 : 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {/* Mostrar remitente si es de grupo y no soy yo */}
          {(type === "equipo" || type === "campeonato") && !isMine && (
            <Text
              style={{
                fontSize: 11,
                color: isDarkMode ? "#a3a3a3" : "#6b7280",
                marginBottom: 2,
                fontWeight: "600",
              }}
            >
              {item.emisor_nombre || "Usuario"}
            </Text>
          )}
          <Text
            style={{
              fontSize: 15,
              color: isMine ? "white" : isDarkMode ? "#ffffff" : "#111827",
            }}
          >
            {item.mensaje}
          </Text>
          {item.fecha_envio && (
            <Text
              style={{
                fontSize: 10,
                color: isMine
                  ? "rgba(255, 255, 255, 0.75)"
                  : isDarkMode
                    ? "#a3a3a3"
                    : "#9ca3af",
                alignSelf: "flex-end",
                marginTop: 4,
                marginLeft: 12,
              }}
            >
              {formatTime(item.fecha_envio)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || mensajes.length < 30) return null;

    return (
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isDarkMode ? "#404040" : "#ffffff",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <Text style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
              Cargando...
            </Text>
          ) : (
            <Text style={{ color: isDarkMode ? "#d1d5db" : "#4b5563", fontWeight: "600" }}>
              Cargar mensajes anteriores
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginRight: 10,
            padding: 8,
            borderRadius: 999,
            backgroundColor: isDarkMode ? "#262626" : "#ffffff",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "white" : "black"}
          />
        </TouchableOpacity>

        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${type === "amigo" ? "bg-indigo-100 dark:bg-indigo-900" : type === "equipo" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}
        >
          {type === "amigo" ? (
            <Text className="text-indigo-600 dark:text-indigo-300 font-bold text-lg">
              {target.nombre?.charAt(0).toUpperCase()}
            </Text>
          ) : type === "equipo" ? (
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={isDarkMode ? "#34d399" : "#10b981"}
            />
          ) : (
            <Ionicons
              name="trophy"
              size={18}
              color={isDarkMode ? "#fbbf24" : "#f59e0b"}
            />
          )}
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-bold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {target.nombre}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {type === "amigo"
              ? conectado
                ? "En línea"
                : "Desconectado"
              : `${miembros.length} ${miembros.length === 1 ? "miembro" : "miembros"}`}
          </Text>
        </View>

        {type !== "amigo" && (
          <TouchableOpacity onPress={() => setShowMembersModal(true)} className="p-2">
            <Ionicons
              name="information-circle-outline"
              size={26}
              color={isDarkMode ? "#cbd5e1" : "#475569"}
            />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, marginBottom: 50 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 120}
      >
        <FlatList
          ref={flatListRef}
          inverted
          data={mensajes}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          renderItem={renderMensaje}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
        />

        {/* Input Area */}
        <View className="flex-row items-center p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <TextInput
            style={{
              flex: 1,
              backgroundColor: isDarkMode ? "#262626" : "#ffffff",
              color: isDarkMode ? "#ffffff" : "#111827",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 12,
              maxHeight: 104,
              marginRight: 10,
            }}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={isDarkMode ? "#a3a3a3" : "#6b7280"}
            value={nuevoMensaje}
            onChangeText={setNuevoMensaje}
            multiline
          />
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: nuevoMensaje.trim()
                ? "#4f46e5"
                : isDarkMode
                  ? "#262626"
                  : "#ffffff",
            }}
            disabled={!nuevoMensaje.trim()}
            onPress={enviarMensaje}
          >
            <Ionicons
              name="send"
              size={18}
              color="white"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Miembros */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: isDarkMode ? '#171717' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '70%',
            padding: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#f5f5f5' : '#171717' }}>
                Miembros del grupo
              </Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={28} color={isDarkMode ? '#a3a3a3' : '#404040'} />
              </TouchableOpacity>
            </View>

            {loadingMiembros ? (
              <ActivityIndicator size="large" color="#f59e0b" />
            ) : (
              <FlatList
                data={miembros}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#262626' : '#f3f4f6' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', overflow: 'hidden', marginRight: 12 }}>
                      {item.url_foto_perfil ? (
                        <Image source={{ uri: item.url_foto_perfil.startsWith('http') ? item.url_foto_perfil : `${API_BASE_URL.replace('/api', '')}${item.url_foto_perfil}` }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="person" size={24} color="#9ca3af" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: isDarkMode ? '#f5f5f5' : '#171717' }}>
                        {item.nombre}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#f59e0b', textTransform: 'capitalize' }}>
                        {item.rol}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
