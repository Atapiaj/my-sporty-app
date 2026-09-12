import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';
import { EventoContext } from '../context/EventoContext';
import { ThemeContext } from '../context/ThemeContext';

const EQUIPOS_DISPONIBLES = [
  { id: '1', nombre: 'Tigres FC' },
  { id: '2', nombre: 'Águilas Doradas' },
  { id: '3', nombre: 'Leones Rojos' },
  { id: '4', nombre: 'Toros del Sur' },
  { id: '5', nombre: 'Dragones Verdes' },
  { id: '6', nombre: 'Halcones Azules' },
];

export default function SeleccionarEquiposScreen({ route, navigation }) {
  const { eventoBase, numEquipos } = route.params;
  const { agregarEvento } = useContext(EventoContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [seleccionados, setSeleccionados] = useState([]);

  const toggleEquipo = (equipo) => {
    if (seleccionados.find((e) => e.id === equipo.id)) {
      setSeleccionados(seleccionados.filter((e) => e.id !== equipo.id));
    } else if (seleccionados.length < numEquipos) {
      setSeleccionados([...seleccionados, equipo]);
    }
  };

  const handleCrear = () => {
    if (seleccionados.length !== numEquipos) {
      Alert.alert('Error', `Debes seleccionar exactamente ${numEquipos} equipos`);
      return;
    }

    const eventoConEquipos = {
      ...eventoBase,
      equipos: seleccionados,
    };

    agregarEvento(eventoBase.fechaInicio, eventoConEquipos);
    navigation.navigate('Calendario');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#171717' : '#fff' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#60a5fa' : '#1D4ED8' }]}>Selecciona {numEquipos} equipos</Text>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {EQUIPOS_DISPONIBLES.map((item) => {
          const seleccionado = seleccionados.find((e) => e.id === item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.row,
                { borderColor: isDarkMode ? '#404040' : '#ccc', backgroundColor: isDarkMode ? '#262626' : '#fafafa' },
                seleccionado && { backgroundColor: isDarkMode ? '#065f46' : '#A7F3D0', borderColor: '#10B981' }
              ]}
              onPress={() => toggleEquipo(item)}
            >
              <Text style={[styles.rowText, { color: isDarkMode ? '#ffffff' : '#111827' }]}>{item.nombre}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.submit}>
        <Button title="Crear Campeonato" onPress={handleCrear} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  row: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  rowText: {
    fontSize: 16,
  },
  submit: {
    marginTop: 16,
  },
});