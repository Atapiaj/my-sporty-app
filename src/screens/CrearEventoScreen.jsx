import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { EventoContext } from "../context/EventoContext";
import { CampeonatoContext } from "../context/CampeonatoContext";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { getEquiposService } from "../services/equipoService";
import { AuthContext } from "../context/AuthContext";
import { Modal, ActivityIndicator } from "react-native";

export default function CrearEventoScreen({ navigation }) {
  const { agregarEvento } = useContext(EventoContext);
  const { agregarCampeonato } = useContext(CampeonatoContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoActividad, setTipoActividad] = useState("partido");
  const [privacidad, setPrivacidad] = useState("publico");
  const [deporte, setDeporte] = useState("futbol");
  const [jugadores, setJugadores] = useState("");
  const [suplentes, setSuplentes] = useState("");
  const [numEquipos, setNumEquipos] = useState("");

  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [mostrarInicio, setMostrarInicio] = useState(false);
  const [mostrarFin, setMostrarFin] = useState(false);
  
  const { usuario } = useContext(AuthContext);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pendingEventoData, setPendingEventoData] = useState(null);

  const handleContinuar = async () => {
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedInicio = formatDateLocal(fechaInicio);
    const formattedFin = formatDateLocal(fechaFin);

    console.log(formattedInicio)

    if (!event || !formattedInicio) {
      return alert("Nombre, Lugar y Fecha de inicio son obligatorios");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inicioDate = new Date(fechaInicio);
    inicioDate.setHours(0, 0, 0, 0);
    const finDate = new Date(fechaFin);
    finDate.setHours(0, 0, 0, 0);

    let estado = 'borrador';
    if (tipoActividad === 'campeonato' && finDate.getTime() < today.getTime()) {
      estado = 'finalizado';
    } else if (inicioDate.getTime() <= today.getTime()) {
      estado = 'activo';
    } else if (inicioDate.getTime() > today.getTime()) {
      estado = 'borrador';
    }
 
    const eventoData = {
      nombre: event,
      location,
      descripcion,
      dotColor:
        deporte === "futbol"
          ? "green"
          : deporte === "baloncesto"
            ? "orange"
            : deporte === "beisbol"
              ? "blue"
              : "purple",
      tipoActividad,
      deporte,
      // Public championships always have inscriptions open by default;
      // private ones start closed (invited only)
      inscripciones_abiertas: privacidad === 'privado' ? 0 : 1,
      estado,
      numero_jugadores: jugadores,
      numero_suplentes: suplentes,
      numero_equipos: numEquipos,
      fecha_fin: tipoActividad === "campeonato" ? formattedFin : null,
      fecha_inicio: formattedInicio,
      privacidad,
    };

    if (tipoActividad === "campeonato") {
      if (!numEquipos || isNaN(numEquipos)) {
        return alert("Número de equipos inválido");
      }
      agregarCampeonato(eventoData);
      setEvent("");
      setLocation("");
      setDescripcion("");
      setTipoActividad("partido");
      setPrivacidad("publico");
      setDeporte("futbol");
      setJugadores("");
      setSuplentes("");
      setNumEquipos("");
      setFechaInicio(new Date());
      setFechaFin(new Date());
      alert("Campeonato creado exitosamente");
      navigation.navigate("Inicio");
    } else {
      setPendingEventoData(eventoData);
      setLoadingTeams(true);
      setTeamModalVisible(true);
      getEquiposService().then(res => {
        const allTeams = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const myTeams = allTeams.filter(t => t.propietario_id === usuario?.id && t.deporte === deporte);
        setUserTeams(myTeams);
      }).catch(err => {
        console.error(err);
        setUserTeams([]);
      }).finally(() => {
        setLoadingTeams(false);
      });
    }
  };

  const confirmarCreacionPartido = async () => {
    if (!selectedTeam) {
      return alert("Selecciona un equipo local");
    }
    const finalData = { ...pendingEventoData, equipo_local_id: selectedTeam };
    await agregarCampeonato(finalData);
    setTeamModalVisible(false);
    setSelectedTeam(null);
    setPendingEventoData(null);
    alert("Partido creado exitosamente");
    navigation.navigate("Inicio");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}>
      <View className="bg-terniary dark:bg-blue-900 ">
        <Text className="text-1xl font-bold text-white  p-2 text-center">
          Crear {tipoActividad === "campeonato" ? "Campeonato" : "Evento"}
        </Text>
      </View>
      <View className="px-6 py-5">
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Información
          </Text>

          <TextInput
            placeholder="Nombre del evento"
            className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            placeholderTextColor="#999"
            value={event}
            onChangeText={setEvent}
          />

          <TextInput
            placeholder="Descripción (opcional)"
            className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            placeholderTextColor="#999"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Tipo de Actividad */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Tipo
          </Text>
          <View className="flex-row gap-2">
            {["partido", "campeonato"].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                onPress={() => setTipoActividad(tipo)}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  tipoActividad === tipo
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    tipoActividad === tipo
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {tipo === "partido" ? "Partido" : "Campeonato"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Privacidad
          </Text>
          <View className="flex-row gap-2">
            {[
              { label: "Público", value: "publico", icon: "globe-outline" },
              {
                label: "Privado",
                value: "privado",
                icon: "lock-closed-outline",
              },
            ].map((priv) => (
              <TouchableOpacity
                key={priv.value}
                onPress={() => setPrivacidad(priv.value)}
                className={`flex-1 py-2 px-3 rounded-lg border flex-row items-center justify-center gap-1 ${
                  privacidad === priv.value
                    ? priv.value == "publico"
                      ? "bg-green border-green"
                      : "bg-red/70 border-red/70"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <Ionicons
                  name={priv.icon}
                  size={14}
                  color={privacidad === priv.value ? "#fff" : "#999"}
                />
                <Text
                  className={`text-xs font-medium ${
                    privacidad === priv.value
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {priv.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Deporte
          </Text>
          <View className="flex-row gap-2">
            {[
              { label: "Fútbol", value: "futbol" },
              { label: "Baloncesto", value: "baloncesto" },
              { label: "Béisbol", value: "beisbol" },
              { label: "Voleibol", value: "voleibol" },
            ].map((dep) => (
              <TouchableOpacity
                key={dep.value}
                onPress={() => setDeporte(dep.value)}
                className={`flex-1 py-2 rounded-lg border ${
                  deporte === dep.value
                    ? "bg-fourty dark:bg-fourty border-fourty dark:border-fourty"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <Text
                  className={`text-center text-xs font-medium ${
                    deporte === dep.value
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {dep.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Participantes
          </Text>
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Jugadores
              </Text>
              <TextInput
                placeholder="0"
                className="border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center text-sm"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                value={jugadores}
                onChangeText={setJugadores}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Suplentes
              </Text>
              <TextInput
                placeholder="0"
                className="border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center text-sm"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                value={suplentes}
                onChangeText={setSuplentes}
              />
            </View>
          </View>

          {tipoActividad === "campeonato" && (
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Equipos
              </Text>
              <TextInput
                placeholder="0"
                className="border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center text-sm"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                value={numEquipos}
                onChangeText={setNumEquipos}
              />
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Fechas
          </Text>

          <View className="mb-2">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Inicio
            </Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'transparent',
                  color: isDarkMode ? "#fff" : "#000",
                }}
                value={fechaInicio.toISOString().split("T")[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                    setFechaInicio(newDate);
                  }
                }}
              />
            ) : (
              <View>
                <TouchableOpacity
                  onPress={() => setMostrarInicio(true)}
                  className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                    {fechaInicio.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Ionicons name="calendar" size={16} color="#666" />
                </TouchableOpacity>
  
                {mostrarInicio && (
                  <DateTimePicker
                    value={fechaInicio}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, date) => {
                      setMostrarInicio(false);
                      if (date) setFechaInicio(date);
                    }}
                  />
                )}
              </View>
            )}
          </View>

          {tipoActividad === "campeonato" && (
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Fin
              </Text>
              {Platform.OS === "web" ? (
                <input
                  type="date"
               
                  value={fechaFin.toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                      setFechaFin(newDate);
                    }
                  }}
                />
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() => setMostrarFin(true)}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                      {fechaFin.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Ionicons name="calendar" size={16} color="#666" />
                  </TouchableOpacity>
  
                  {mostrarFin && (
                    <DateTimePicker
                      value={fechaFin}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, date) => {
                        setMostrarFin(false);
                        if (date) setFechaFin(date);
                      }}
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Botón */}
        <TouchableOpacity
          onPress={handleContinuar}
          className="bg-blue-600 dark:bg-blue-700 rounded-lg p-3 mb-8 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">
            {tipoActividad === "campeonato" ? "Siguiente" : "Crear"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={teamModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTeamModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setTeamModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white dark:bg-neutral-800 rounded-t-3xl px-5 pt-5 pb-10">
              <View className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full self-center mb-4" />
              <Text className="text-base font-bold text-[#1a1a1a] dark:text-white mb-1">
                Selecciona tu Equipo Local
              </Text>
              <Text className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
                Elige el equipo que jugará como local en este partido:
              </Text>

              {loadingTeams ? (
                <ActivityIndicator color="#4f46e5" className="my-6" />
              ) : userTeams.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons name="shield-outline" size={36} color="#aaa" />
                  <Text className="text-sm text-gray-500 dark:text-neutral-400 mt-2 text-center">
                    No tienes equipos en este deporte ({deporte}). Crea uno primero.
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                  {userTeams.map((equipo) => (
                    <TouchableOpacity
                      key={equipo.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        padding: 16, borderRadius: 12, mb: 8,
                        borderWidth: 1,
                        borderColor: selectedTeam === equipo.id ? '#4f46e5' : (isDarkMode ? '#374151' : '#eaeaea'),
                        backgroundColor: selectedTeam === equipo.id
                          ? (isDarkMode ? '#312e81' : '#eef2ff')
                          : (isDarkMode ? '#262626' : '#ffffff'),
                        marginBottom: 8
                      }}
                      onPress={() => setSelectedTeam(equipo.id)}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                          selectedTeam === equipo.id ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                        }`}
                      >
                        {selectedTeam === equipo.id && (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </View>
                      <Text className="text-sm font-semibold text-[#1a1a1a] dark:text-white">{equipo.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {userTeams.length > 0 && (
                <TouchableOpacity
                  style={{
                    marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    backgroundColor: selectedTeam ? '#4f46e5' : '#d1d5db',
                  }}
                  onPress={confirmarCreacionPartido}
                  disabled={!selectedTeam}
                >
                  <Text className="text-white font-bold text-sm">Crear Partido</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
