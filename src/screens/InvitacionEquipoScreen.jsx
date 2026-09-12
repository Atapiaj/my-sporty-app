import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Button, Alert
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { AmistadContext } from '../context/AmistadContext';
import { EquipoContext } from '../context/EquipoContext';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function InvitarAmigosScreen({ navigation }) {
  const { amigos, cargarAmigos } = useContext(AmistadContext);
  const { enviarInvitacion } = useContext(EquipoContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [enviando, setEnviando] = useState(null);
  const route = useRoute();
  const { equipoId } = route.params;

  useEffect(() => {
    const cargarDatos = async () => {
      await cargarAmigos();
    };
    cargarDatos();
  },[]);

  const enviarInvitacionAEquipo = async (amigoId) => {
    setEnviando(amigoId);
    try {
      let res = await enviarInvitacion(amigoId, equipoId);

      if (res.status === 201) {
        Alert.alert('Éxito', 'Invitación enviada correctamente');
      }

    } catch (error) {
      if (error.status === 409) {
        Alert.alert('Conflicto', 'parece que ya enviaste una invitación a este amigo');
      }
      else{
        Alert.alert('Error', 'No se pudo enviar la invitación. Intente nuevamente.');
      }
    }
    finally {
      setEnviando(null);
    }
  }

  const renderAmigo = ({ item }) => (
    <View style={[styles.amigoContainer, { borderColor: isDarkMode ? '#262626' : '#f0f0f0' }]}>
      <Text style={[styles.amigoNombre, { color: isDarkMode ? '#ffffff' : '#111827' }]}>{item.nombre}</Text>
      <TouchableOpacity 
        onPress={() => enviarInvitacionAEquipo(item.id)}
        disabled={enviando === item.id}
        style={{
          paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'center', backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff',
          paddingVertical: 10, borderRadius: 12,
          borderWidth: 1, borderColor: isDarkMode ? '#3b82f6' : '#dbeafe'
        }}
      >
        <Ionicons name="add-circle-outline" size={16} color={isDarkMode ? '#60a5fa' : '#1D4ED8'} />
        <Text className="text-blue-700 dark:text-blue-300 font-bold ml-1.5 text-xs">Invitar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#171717' : '#fff' }]}>
      <FlatList
        style={{ flex: 1 }}
        data={amigos}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderAmigo}
        ListEmptyComponent={<Text style={{ color: isDarkMode ? '#a3a3a3' : '#6b7280', textAlign: 'center', marginTop: 20 }}>No tienes amigos disponibles</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#1E40AF' },
  amigoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  amigoNombre: { fontSize: 16 },
});