import React, { useContext } from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const FixtureInvitadosScreen = ({ route }) => {
  const { equiposInvitados } = route.params || { equiposInvitados: [] };
  const { isDarkMode } = useContext(ThemeContext);

  const generarFixture = (equipos) => {
    const fixture = [];
    for (let i = 0; i < equipos.length; i += 2) {
      if (i + 1 < equipos.length) {
        fixture.push({
          id: i,
          equipo1: equipos[i],
          equipo2: equipos[i + 1],
          fecha: `Fecha ${Math.floor(i / 2) + 1}`,
        });
      }
    }
    return fixture;
  };

  const fixture = generarFixture(equiposInvitados);

  const renderItem = ({ item }) => (
    <View
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#1a1a1a', marginBottom: 2 }}>
        {item.equipo1} vs {item.equipo2}
      </Text>
      <Text style={{ fontSize: 13, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{item.fecha}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#171717' : '#f9fafb' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#1a1a1a', marginBottom: 16 }}>
          Fixture de Equipos Invitados
        </Text>
        {fixture.length > 0 ? (
          <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
            <FlatList
              data={fixture}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderItem}
            />
          </View>
        ) : (
          <View style={{ padding: 32, alignItems: 'center', backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#e5e7eb', borderStyle: 'dashed' }}>
            <Text style={{ color: isDarkMode ? '#6b7280' : '#9ca3af', fontSize: 14 }}>
              No hay suficientes equipos para generar un fixture.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FixtureInvitadosScreen;