import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const STATUS_CONFIG = {
  activo: { label: "En juego", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  en_curso: { label: "En juego", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  en_juego: { label: "En juego", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  programado: { label: "Programado", bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  finalizado: { label: "Finalizado", bg: "#f5f3ff", text: "#5b21b6", dot: "#7c3aed" },
  cancelado: { label: "Cancelado", bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

const SPORT_ICONS = {
  futbol: "sports-soccer",
  fútbol: "sports-soccer",
  baloncesto: "sports-basketball",
  basquetbol: "sports-basketball",
  básquetbol: "sports-basketball",
  beisbol: "sports-baseball",
  béisbol: "sports-baseball",
  voleibol: "sports-volleyball",
  voley: "sports-volleyball",
};

export default function PartidoCard({ partido, onPress }) {
  if (!partido) return null;

  const estadoKey = (partido.estado || "programado").toLowerCase();
  const sc = STATUS_CONFIG[estadoKey] || STATUS_CONFIG.programado;

  const deporteKey = (partido.campeonato_deporte || partido.deporte || "").toLowerCase().trim();
  const sportIcon = SPORT_ICONS[deporteKey] || "sports-score";

  const localNombre = partido.equipo_local_nombre || "Por Definir";
  const visitanteNombre = partido.equipo_visitante_nombre || "Por Definir";

  const puntosLocal = partido.puntos_local !== null && partido.puntos_local !== undefined ? partido.puntos_local : "-";
  const puntosVisitante = partido.puntos_visitante !== null && partido.puntos_visitante !== undefined ? partido.puntos_visitante : "-";

  const isFinalizado = estadoKey === "finalizado";

  const formatHora = (fechaStr) => {
    if (!fechaStr) return null;
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  const horaStr = formatHora(partido.fecha);
  const lugarStr = partido.escenario_nombre || partido.lugar || "Escenario por definir";

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 0.5,
        overflow: 'hidden',
        borderColor: '#eaeaea',
      }}
    >
      {/* ── Header: Deporte, Campeonato & Estado ── */}
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-[#f8f8f8] dark:bg-neutral-900 border-b border-[#eaeaea] dark:border-neutral-700">
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          <MaterialIcons name={sportIcon} size={15} color="#6366f1" />
          <Text className="text-[12px] font-semibold text-[#1a1a1a] dark:text-white capitalize" numberOfLines={1}>
            {partido.campeonato_nombre || partido.deporte || "Encuentro"}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {partido.jornada ? (
            <View className="border border-[#eaeaea] dark:border-neutral-700 rounded-full px-2 py-0.5 bg-white dark:bg-neutral-800">
              <Text className="text-[10px] font-medium text-gray-500 dark:text-neutral-400">
                Jornada {partido.jornada}
              </Text>
            </View>
          ) : null}

          <View style={{ backgroundColor: sc.bg }} className="rounded-full px-2.5 py-0.5 flex-row items-center">
            <View style={{ backgroundColor: sc.dot }} className="w-1.5 h-1.5 rounded-full mr-1.5" />
            <Text style={{ color: sc.text }} className="text-[10px] font-bold">
              {sc.label}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body: Enfrentamiento 2 Equipos ── */}
      <View className="px-4 py-4 dark:bg-neutral-800">
        <View className="flex-row items-center justify-between">
          
          {/* Equipo Local */}
          <View className="flex-1 items-center px-1">
            <View className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mb-2 border border-indigo-100 dark:border-indigo-800/40 overflow-hidden">
              {partido.equipo_local_logo ? (
                <Image source={{ uri: partido.equipo_local_logo }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Ionicons name="shield-outline" size={22} color="#6366f1" />
              )}
            </View>
            <Text className="text-[13px] font-bold text-[#1a1a1a] dark:text-white text-center" numberOfLines={2}>
              {localNombre}
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">Local</Text>
          </View>

          {/* Marcador Central / VS */}
          <View className="items-center px-2 min-w-[70px]">
            {isFinalizado || estadoKey === "en_curso" || estadoKey === "en_juego" ? (
              <View className="bg-indigo-600 px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
                <Text className="text-white font-extrabold text-[16px]">{puntosLocal}</Text>
                <Text className="text-indigo-200 mx-1.5 font-bold text-[14px]">-</Text>
                <Text className="text-white font-extrabold text-[16px]">{puntosVisitante}</Text>
              </View>
            ) : (
              <View className="bg-gray-100 dark:bg-neutral-700/60 px-3 py-1 rounded-full border border-gray-200 dark:border-neutral-600">
                <Text className="text-indigo-600 dark:text-indigo-400 font-black text-[13px]">VS</Text>
              </View>
            )}
            
            {horaStr && (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="time-outline" size={11} color="#6b7280" />
                <Text className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 ml-1">
                  {horaStr}
                </Text>
              </View>
            )}
          </View>

          {/* Equipo Visitante */}
          <View className="flex-1 items-center px-1">
            <View className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mb-2 border border-indigo-100 dark:border-indigo-800/40 overflow-hidden">
              {partido.equipo_visitante_logo ? (
                <Image source={{ uri: partido.equipo_visitante_logo }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Ionicons name="shield-outline" size={22} color="#6366f1" />
              )}
            </View>
            <Text className="text-[13px] font-bold text-[#1a1a1a] dark:text-white text-center" numberOfLines={2}>
              {visitanteNombre}
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">Visitante</Text>
          </View>

        </View>

        {/* Ubicación / Escenario */}
        <View className="flex-row items-center justify-center mt-3 pt-2.5 border-t border-gray-100 dark:border-neutral-700/60">
          <Ionicons name="location-outline" size={13} color="#9ca3af" style={{ marginRight: 4 }} />
          <Text className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium" numberOfLines={1}>
            {lugarStr}
          </Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View className="px-4 py-2.5 bg-[#fafafa] dark:bg-neutral-900 border-t border-[#f0f0f0] dark:border-neutral-700/50 flex-row items-center justify-center gap-1">
        <Ionicons name="trophy-outline" size={13} color="#6366f1" />
        <Text className="text-center text-[12px] text-indigo-600 dark:text-indigo-400 font-semibold">
          Ver detalles del partido
        </Text>
      </View>
    </TouchableOpacity>
  );
}
