import { useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { EquipoContext } from '../context/EquipoContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const SPORT_ICONS = {
  futbol: "sports-soccer",
  baloncesto: "sports-basketball",
  beisbol: "sports-baseball",
  voleibol: "sports-volleyball",
};

const TeamCard = ({ item, isOwner, onEdit, onInvite, onDelete, onPress }) => {
  const iconName = SPORT_ICONS[item.deporte?.toLowerCase()] || "shield-outline";
  const { isDarkMode } = useContext(ThemeContext);
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDarkMode ? '#374151' : '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
          <MaterialIcons name={iconName} size={28} color="#1D4ED8" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {item.nombre}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 dark:text-neutral-400 capitalize bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-md mr-2">
              {item.deporte}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 dark:text-neutral-400 ml-1">
                {item.total_miembros ?? 0} miembros
              </Text>
            </View>
          </View>
        </View>
      </View>

      {isOwner && (
        <View className="flex-row mt-2 pt-3 border-t border-gray-50 dark:border-neutral-700 gap-2">
          <TouchableOpacity 
            onPress={onEdit}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff',
              paddingVertical: 10, borderRadius: 12,
              borderWidth: 1, borderColor: isDarkMode ? '#1d4ed8' : '#dbeafe',
            }}
          >
            <Ionicons name="create-outline" size={16} color={isDarkMode ? '#93c5fd' : '#1D4ED8'} />
            <Text className="text-blue-700 dark:text-blue-400 font-bold ml-1.5 text-xs">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onInvite}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#14532d' : '#f0fdf4',
              paddingVertical: 10, borderRadius: 12,
              borderWidth: 1, borderColor: isDarkMode ? '#16a34a' : '#dcfce7',
            }}
          >
            <Ionicons name="person-add-outline" size={16} color={isDarkMode ? '#86efac' : '#16A34A'} />
            <Text className="text-green-700 dark:text-green-400 font-bold ml-1.5 text-xs">Invitar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onDelete}
            style={{
              backgroundColor: isDarkMode ? '#450a0a' : '#fef2f2',
              paddingHorizontal: 16,
              paddingVertical: 10, borderRadius: 12,
              borderWidth: 1, borderColor: isDarkMode ? '#991b1b' : '#fee2e2',
            }}
          >
            <Ionicons name="trash-outline" size={16} color={isDarkMode ? '#f87171' : '#DC2626'} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function EquiposScreen({ navigation }) {
  const { yourTeams, otherTeams, getEquipos, deleteEquipo, isLoading } = useContext(EquipoContext);
  const { usuario } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const confirmarEliminar = (id) => {
    Alert.alert(
      '¿Eliminar equipo?',
      'Esta acción no se puede deshacer y eliminará a todos los miembros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteEquipo(id);
          },
        },
      ]
    );
  };

  const renderSectionHeader = (title, count) => (
    <View className="flex-row items-center justify-between mt-6 mb-4 px-1">
      <Text className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest ">
        {title}
      </Text>
      <View className="bg-gray-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
        <Text className="text-[10px] font-bold text-gray-600 dark:text-neutral-400">{count}</Text>
      </View>
    </View>
  );

  useEffect(() => {
    getEquipos();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }} >
      <View style={{ flex: 1 }} className="px-4">
        {isLoading && yourTeams.length === 0 && otherTeams.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1D4ED8" size="large" />
          </View>
        ) : (
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {renderSectionHeader("Mis Equipos", yourTeams.length)}
            {yourTeams.length === 0 ? (
              <View className="py-8 items-center bg-white dark:bg-neutral-800 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-700 mb-4">
                <Ionicons name="shield-outline" size={40} color="#9CA3AF" />
                <Text className="text-gray-400 dark:text-neutral-500 mt-2 text-sm italic">No tienes equipos aún</Text>
              </View>
            ) : (
              yourTeams.map(item => (
                <TeamCard 
                  key={item.id} 
                  item={item} 
                  isOwner={true} 
                  onEdit={() => navigation.navigate('EditarEquipoScreen', { equipo: item })}
                  onInvite={() => navigation.navigate('InvitacionEquipoScreen', { equipoId: item.id })}
                  onDelete={() => confirmarEliminar(item.id)}
                  onPress={() => navigation.navigate('DetalleEquipoScreen', { equipo: item, isOwner: true })}
                />
              ))
            )}

            {renderSectionHeader("Inscrito en", otherTeams.length)}
            {otherTeams.length === 0 ? (
              <View className="py-8 items-center bg-white dark:bg-neutral-800 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-700 mb-4">
                <Ionicons name="people-outline" size={40} color="#9CA3AF" />
                <Text className="text-gray-400 dark:text-neutral-500 mt-2 text-sm italic">No estás en otros equipos</Text>
              </View>
            ) : (
              otherTeams.map(item => (
                <TeamCard 
                  key={item.id} 
                  item={item} 
                  isOwner={false} 
                  onPress={() => navigation.navigate('DetalleEquipoScreen', { equipo: item, isOwner: false })}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity
          style={{
            flexDirection: 'row', backgroundColor: '#1d4ed8',
            paddingHorizontal: 32, paddingVertical: 16,
            borderRadius: 999, alignItems: 'center', justifyContent: 'center',
            shadowColor: "#1D4ED8", shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
          }}
          onPress={() => navigation.navigate('CrearEquipo')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">Crear Equipo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}