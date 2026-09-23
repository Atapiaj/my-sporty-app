import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const STATUS_CONFIG = {
  activo: { label: "Activo", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  publicado: { label: "Activo", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  programado: { label: "Programado", bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  borrador: { label: "Borrador", bg: "#f3f4f6", text: "#4b5563", dot: "#9ca3af" },
  finalizado: { label: "Finalizado", bg: "#f5f3ff", text: "#5b21b6", dot: "#7c3aed" },
};

const SPORT_ICONS = {
  futbol: "sports-soccer",
  baloncesto: "sports-basketball",
  beisbol: "sports-baseball",
  voleibol: "sports-volleyball",
};

export default function EventCard({ evento, onPress, showJoinButton, onJoin, isDarkMode }) {
  const estado = evento.estado || "borrador";
  const sc = STATUS_CONFIG[estado] || STATUS_CONFIG.borrador;

  const inscOpen = evento.inscripciones_abiertas == 1;
  const totalSlots = parseInt(evento.numero_equipos, 10) || 0;
  const inscribed = parseInt(evento.equipos_inscritos, 10) || 0;
  const slotsLeft = Math.max(0, totalSlots - inscribed);

  const isFinalized = estado === "finalizado";
  const champion = evento.campeon_nombre;
  const sportIcon = SPORT_ICONS[evento.deporte] || "trophy-outline";

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={{
        marginHorizontal: 20, marginBottom: 16,
        borderRadius: 16, backgroundColor: isDarkMode ? '#171717' : '#ffffff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
        borderWidth: 0.5, overflow: 'hidden', borderColor: '#eaeaea',
      }}
    >
      {/* ── Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#f8f8f8] dark:bg-neutral-900 border-b border-[#eaeaea] dark:border-neutral-700">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name={sportIcon} size={15} color="#6366f1" />
          <Text className="text-[13px] font-semibold text-[#1a1a1a] dark:text-white capitalize">
            {evento.deporte || "Deporte"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="border border-[#eaeaea] dark:border-neutral-700 rounded-full px-2.5 py-0.5 bg-white dark:bg-neutral-800">
            <Text className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 capitalize">
              {evento.privacidad === "publico" ? "Público" : "Privado"}
            </Text>
          </View>
          <View style={{ backgroundColor: sc.bg }} className="rounded-full px-2.5 py-0.5 flex-row items-center">
            <View style={{ backgroundColor: sc.dot }} className="w-1.5 h-1.5 rounded-full mr-1.5" />
            <Text style={{ color: sc.text }} className="text-[11px] font-bold">
              {sc.label}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body */}
      <View className="px-4 pt-3 pb-2 dark:bg-neutral-800">
        <Text className="text-[18px] font-bold text-[#1a1a1a] dark:text-white mb-1" numberOfLines={1}>
          {evento.nombre}
        </Text>
        {evento.descripcion ? (
          <Text className="text-[13px] text-[#6a6a6a] dark:text-neutral-400 mb-3 leading-5" numberOfLines={2}>
            {evento.descripcion}
          </Text>
        ) : null}

        {isFinalized && champion && (
          <View className="flex-row items-center bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-3 py-2.5 mb-3 border border-yellow-200 dark:border-yellow-800/40">
            <Text className="text-xl mr-2">🏆</Text>
            <View>
              <Text className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-widest">Campeón</Text>
              <Text className="text-[14px] font-bold text-[#1a1a1a] dark:text-white">{champion}</Text>
            </View>
          </View>
        )}

        <View className="flex-row bg-[#fafafa] dark:bg-neutral-900/50 rounded-xl border border-[#eaeaea] dark:border-neutral-700/50 mb-3 overflow-hidden">
          <View className="flex-1 items-center py-2.5 border-r border-[#eaeaea] dark:border-neutral-700">
            <Text className="text-[10px] text-[#8a8a8a] dark:text-neutral-500 font-medium mb-0.5">JUGADORES</Text>
            <Text className="text-[15px] font-bold text-[#1a1a1a] dark:text-white">{evento.numero_jugadores ?? "—"}</Text>
          </View>
          <View className="flex-1 items-center py-2.5 border-r border-[#eaeaea] dark:border-neutral-700">
            <Text className="text-[10px] text-[#8a8a8a] dark:text-neutral-500 font-medium mb-0.5">SUPLENTES</Text>
            <Text className="text-[15px] font-bold text-[#1a1a1a] dark:text-white">{evento.numero_suplentes ?? "—"}</Text>
          </View>
          <View className="flex-1 items-center py-2.5">
            <Text className="text-[10px] text-[#8a8a8a] dark:text-neutral-500 font-medium mb-0.5">EQUIPOS</Text>
            <Text className="text-[15px] font-bold text-[#1a1a1a] dark:text-white">
              {inscribed}/{totalSlots > 0 ? totalSlots : "—"}
            </Text>
          </View>
        </View>

        {evento.fecha_inicio && (
          <View className="flex-row items-center mb-2 gap-1 ">
            <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
            <Text className="text-[12px] text-gray-400 dark:text-neutral-500">
              {formatDate(evento.fecha_inicio)}
              {evento.fecha_fin ? ` → ${formatDate(evento.fecha_fin)}` : ""}
            </Text>
          </View>
        )}

        {!isFinalized && (
          <View className="flex-row items-center gap-1 mb-1">
            <View className={`w-2 h-2 rounded-full ${inscOpen ? "bg-green-500" : "bg-red-400"}`} />
            <Text className={`text-[12px] font-semibold ${inscOpen ? "text-green-600 dark:text-green" : "text-red dark:text-red"}`}>
              Inscripciones {inscOpen ? "Abiertas" : "Cerradas"}
            </Text>
            {inscOpen && totalSlots > 0 && (
              <Text className="text-[12px] text-gray-400 dark:text-neutral-500 ml-1">
                ({slotsLeft} cupo{slotsLeft !== 1 ? "s" : ""} libre{slotsLeft !== 1 ? "s" : ""})
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ── Footer */}
      {showJoinButton ? (
        <TouchableOpacity
          style={{
            marginHorizontal: 16, marginBottom: 16, marginTop: 4,
            paddingVertical: 12, backgroundColor: isDarkMode ? '#4f46e5' : '#4f46e5',
            borderRadius: 12, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
          onPress={onJoin}
        >
          <Ionicons name="enter-outline" size={16} color="#fff" />
          <Text className="text-white font-bold text-sm">Solicitar unirse</Text>
        </TouchableOpacity>
      ) : evento.equipo_inscrito_nombre ? (
        <View className="mx-4 mb-4 mt-1 py-3 bg-green dark:bg-green/20 border border-green dark:border-green/40 rounded-xl items-center flex-row justify-center gap-2">
          <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
          <Text className="text-white dark:text-green font-bold text-sm">Inscrito con: {evento.equipo_inscrito_nombre}</Text>
        </View>
      ) : (
        <View className="px-4 py-3 bg-[#fafafa] dark:bg-neutral-900 border-t border-[#f0f0f0] dark:border-neutral-700/50 flex-row items-center justify-center gap-1">
          <Ionicons name="eye-outline" size={14} color="#6366f1" />
          <Text className="text-center text-[13px] text-indigo-600 dark:text-indigo-400 font-semibold">
            Ver detalles
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
