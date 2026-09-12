import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { NotificacionContext } from '../context/NotificacionContext';
import { AmistadContext } from '../context/AmistadContext';
import { getSolicitudesUnionCampeonatoService } from '../services/notificacionService';
import { ThemeContext } from '../context/ThemeContext';

// ─── Helper: Section Header ────────────────────────────────────────────
const SectionHeader = ({ icon, title, count }) => (
  <View className="flex-row items-center mb-4 mt-6 px-1">
    <View className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-3 shadow-sm border border-blue-100 dark:border-blue-800">
      <Ionicons name={icon} size={18} color="#1D4ED8" />
    </View>
    <Text className="text-xs font-extrabold text-gray-500 dark:text-neutral-400 uppercase tracking-widest flex-1">{title}</Text>
    {count > 0 && (
      <View className="bg-blue-600 px-2.5 py-1 rounded-full items-center justify-center shadow-lg shadow-blue-400">
        <Text className="text-white text-[10px] font-black">{count}</Text>
      </View>
    )}
  </View>
);

// ─── Helper: Empty Box ─────────────────────────────────────────────────
const EmptyBox = ({ text }) => (
  <View className="p-10 bg-white dark:bg-neutral-800 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-700 items-center mb-6">
    <Ionicons name="mail-open-outline" size={32} color="#D1D5DB" />
    <Text className="text-xs text-gray-400 dark:text-neutral-500 italic mt-3 text-center px-4">{text}</Text>
  </View>
);

// ─── Helper: Action Buttons ────────────────────────────────────────────
const ActionRow = ({ onAccept, onReject }) => (
  <View className="flex-row mt-4 gap-3">
    <TouchableOpacity
      style={{ flex: 1, paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 16, alignItems: 'center', shadowColor: '#93c5fd', shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }}
      onPress={onAccept}
    >
      <Text className="text-white text-sm font-black">Aceptar</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={{ flex: 1, paddingVertical: 12, backgroundColor: isDarkMode ? '#450a0a' : '#fef2f2', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? '#991b1b' : '#fee2e2' }}
      onPress={onReject}
    >
      <Text className="text-red-600 dark:text-red-400 text-sm font-black">Rechazar</Text>
    </TouchableOpacity>
  </View>
);

// ─── Helper: Notification Card ─────────────────────────────────────────
const NotifCard = ({ title, subtitle, date, children }) => (
  <View className="p-5 bg-white dark:bg-neutral-800 rounded-3xl border border-gray-100 dark:border-neutral-700 mb-4 shadow-sm shadow-blue-100 dark:shadow-none">
    <View className="flex-row justify-between items-start">
      <View className="flex-1 pr-4">
        <Text className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</Text>
        {subtitle && <Text className="text-xs text-gray-500 dark:text-neutral-400 mt-1 font-medium">{subtitle}</Text>}
      </View>
      <View className="bg-gray-50 dark:bg-neutral-900 p-2 rounded-xl">
        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
      </View>
    </View>
    {date && (
      <Text className="text-[10px] text-gray-400 dark:text-neutral-500 mt-2 font-bold uppercase tracking-tighter">
        {new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>
    )}
    {children}
  </View>
);

export default function NotificacionesScreen() {
  const {
    solicitudes, invitaciones, invitacionesCampeonato, isLoading,
    cargarSolicitudes, cargarInvitaciones, cargarInvitacionesCampeonatos,
    responderSolicitud, responderInvitacion, responderInvitacionCampeonato,
  } = useContext(NotificacionContext);
  const { cargarAmigos } = useContext(AmistadContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [solicitudesUnion, setSolicitudesUnion] = useState([]);
  const [loadingUnion, setLoadingUnion] = useState(false);

  const loadAll = useCallback(async () => {
    cargarSolicitudes();
    cargarInvitaciones();
    cargarInvitacionesCampeonatos();
    setLoadingUnion(true);
    try {
      const data = await getSolicitudesUnionCampeonatoService();
      setSolicitudesUnion(Array.isArray(data) ? data : []);
    } catch (_) { setSolicitudesUnion([]); }
    setLoadingUnion(false);
  }, [cargarSolicitudes, cargarInvitaciones, cargarInvitacionesCampeonatos]);

  
  React.useEffect(() => {
    loadAll();
  }, []);

  
  const totalPending =
    (solicitudes?.length || 0) +
    (invitaciones?.length || 0) +
    (invitacionesCampeonato?.length || 0) +
    (solicitudesUnion?.length || 0);

  if (isLoading && !solicitudes?.length && !invitaciones?.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }} >
        <ActivityIndicator size="large" color="#1D4ED8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }} >
      <ScrollView style={{ flex: 1 }} className="px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
   

        {totalPending === 0 && !isLoading && !loadingUnion && (
          <View className="items-center mt-12 py-10 px-8 bg-white dark:bg-neutral-800 rounded-[40px] shadow-sm shadow-blue-100 dark:shadow-none">
            <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
               <Ionicons name="checkmark-done" size={32} color="#3B82F6" />
            </View>
            <Text className="text-lg font-black text-gray-900 dark:text-white">¡Todo al día!</Text>
            <Text className="text-xs text-gray-500 dark:text-neutral-400 mt-2 text-center leading-relaxed">No tienes notificaciones pendientes en este momento. Revisa más tarde.</Text>
          </View>
        )}

        {/* ── Amistades ─────────────────────────────────────────── */}
        <SectionHeader icon="people" title="Amistad" count={solicitudes?.length || 0} />
        {solicitudes?.length === 0 ? <EmptyBox text="Sin solicitudes de amistad nuevas." /> : null}
        {(solicitudes || []).map((item) => (
          <NotifCard
            key={item.id}
            title={item.nombre_remitente}
            subtitle="Quiere conectar contigo en la plataforma"
            date={item.fecha_envio}
          >
            <ActionRow
              onAccept={async () => { await responderSolicitud(item.id, 'aceptado'); await cargarSolicitudes(); await cargarAmigos(); }}
              onReject={async () => { await responderSolicitud(item.id, 'rechazado'); await cargarSolicitudes(); }}
            />
          </NotifCard>
        ))}

        {/* ── Invitaciones de Equipo ─────────────────────────────── */}
        <SectionHeader icon="shield" title="Tus Equipos" count={invitaciones?.length || 0} />
        {invitaciones?.length === 0 ? <EmptyBox text="Sin invitaciones de equipo pendientes." /> : null}
        {(invitaciones || []).map((item) => (
          <NotifCard
            key={item.id}
            title={item.nombre_remitente || item.equipo_nombre || 'Nuevo Equipo'}
            subtitle="Te invita a formar parte de su formación titular"
            date={item.fecha_envio}
          >
            <ActionRow
              onAccept={async () => { await responderInvitacion(item.id, 'aceptado'); await cargarInvitaciones(); }}
              onReject={async () => { await responderInvitacion(item.id, 'rechazado'); await cargarInvitaciones(); }}
            />
          </NotifCard>
        ))}

        {/* ── Invitaciones a Campeonatos (owner → team owner) ────── */}
        <SectionHeader icon="trophy" title="Campeonatos" count={invitacionesCampeonato?.length || 0} />
        {invitacionesCampeonato?.length === 0 ? <EmptyBox text="No hay invitaciones a campeonatos vigentes." /> : null}
        {(invitacionesCampeonato || []).map((item) => (
          <NotifCard
            key={item.id}
            title={item.campeonato_nombre}
            subtitle={`Invitado para competir por ${item.de_usuario_nombre}`}
            date={item.fecha_envio}
          >
            <ActionRow
              onAccept={async () => { await responderInvitacionCampeonato(item.id, 'aceptado'); await cargarInvitacionesCampeonatos(); }}
              onReject={async () => { await responderInvitacionCampeonato(item.id, 'rechazado'); await cargarInvitacionesCampeonatos(); }}
            />
          </NotifCard>
        ))}

        {/* ── Solicitudes de Unión (user → owner, owner sees here) ─ */}
        <SectionHeader icon="enter" title="Solicitudes Recibidas" count={solicitudesUnion?.length || 0} />
        {loadingUnion ? (
          <ActivityIndicator color="#1D4ED8" className="mb-4" />
        ) : solicitudesUnion?.length === 0 ? (
          <EmptyBox text="No tienes solicitudes de unión pendientes de tus campeonatos." />
        ) : null}
        {(solicitudesUnion || []).map((item) => (
          <NotifCard
            key={item.id}
            title={item.de_usuario_nombre}
            subtitle={`Pide unir "${item.equipo_nombre}" a tu campeonato: ${item.campeonato_nombre}`}
            date={item.fecha_envio}
          >
            <ActionRow
              onAccept={async () => {
                await responderInvitacionCampeonato(item.id, 'aceptado');
                const data = await getSolicitudesUnionCampeonatoService();
                setSolicitudesUnion(Array.isArray(data) ? data : []);
                await cargarInvitacionesCampeonatos();
              }}
              onReject={async () => {
                await responderInvitacionCampeonato(item.id, 'rechazado');
                const data = await getSolicitudesUnionCampeonatoService();
                setSolicitudesUnion(Array.isArray(data) ? data : []);
                await cargarInvitacionesCampeonatos();
              }}
            />
          </NotifCard>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}