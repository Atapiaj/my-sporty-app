import React, { useContext, useState, useMemo, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import PartidoCard from '../components/PartidoCard';
import { getMisPartidosService } from '../services/eventoService';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Sport color mappings
const SPORT_COLORS = {
  futbol: '#22c55e',      // Verde
  fútbol: '#22c55e',
  baloncesto: '#f97316',  // Naranja
  basquetbol: '#f97316',
  básquetbol: '#f97316',
  beisbol: '#3b82f6',     // Azul
  béisbol: '#3b82f6',
  voleibol: '#a855f7',    // Morado
  voley: '#a855f7',
};

const DEFAULT_SPORT_COLOR = '#6366f1';

const getSportColor = (deporte, fallbackDotColor) => {
  if (!deporte) return fallbackDotColor || DEFAULT_SPORT_COLOR;
  const key = deporte.toLowerCase().trim();
  return SPORT_COLORS[key] || fallbackDotColor || DEFAULT_SPORT_COLOR;
};

const getFechaYMD = (fechaRaw) => {
  if (!fechaRaw) return null;
  if (typeof fechaRaw === 'string') {
    if (fechaRaw.includes('T')) return fechaRaw.split('T')[0];
    if (fechaRaw.includes(' ')) return fechaRaw.split(' ')[0];
    return fechaRaw;
  }
  try {
    return new Date(fechaRaw).toISOString().split('T')[0];
  } catch {
    return null;
  }
};

export default function CalendarioScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { usuario } = useContext(AuthContext);

  const todayDateString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [currentMonth, setCurrentMonth] = useState(todayDateString.substring(0, 7));
  const [misPartidos, setMisPartidos] = useState([]);
  const [isLoadingPartidos, setIsLoadingPartidos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load all user team matches
  const cargarDatos = useCallback(async () => {
    if (!usuario?.id) return;
    setIsLoadingPartidos(true);
    try {
      const partidosData = await getMisPartidosService();
      setMisPartidos(partidosData || []);
    } catch (error) {
      console.error("Error al cargar partidos en calendario:", error);
    } finally {
      setIsLoadingPartidos(false);
    }
  }, [usuario]);

  // Refetch data every time user enters / focuses the Calendar screen
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  }, [cargarDatos]);

  // Create marked dates for Calendar with sport-specific multi-dots (partidos only)
  const markedDates = useMemo(() => {
    const marks = {};

    misPartidos.forEach(partido => {
      if (!partido.fecha) return;
      const dateKey = getFechaYMD(partido.fecha);
      if (!dateKey) return;

      const deporte = partido.campeonato_deporte || partido.deporte;
      const color = getSportColor(deporte);

      if (!marks[dateKey]) {
        marks[dateKey] = { dots: [] };
      }

      const alreadyHasDot = marks[dateKey].dots.some(d => d.color === color);
      if (!alreadyHasDot && marks[dateKey].dots.length < 4) {
        marks[dateKey].dots.push({
          key: `partido-${partido.id}`,
          color: color,
          selectedDotColor: '#ffffff'
        });
      }
    });

    // Override/merge selected day style
    if (marks[selectedDate]) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: '#2563eb'
      };
    } else {
      marks[selectedDate] = {
        selected: true,
        selectedColor: '#2563eb',
        dots: []
      };
    }
    return marks;
  }, [misPartidos, selectedDate]);

  // Partidos for selected day
  const selectedDayPartidos = useMemo(() => {
    return misPartidos.filter(partido => getFechaYMD(partido.fecha) === selectedDate);
  }, [misPartidos, selectedDate]);

  // Upcoming partidos
  const upcomingPartidos = useMemo(() => {
    return misPartidos
      .filter(partido => {
        const ymd = getFechaYMD(partido.fecha);
        return ymd && ymd > todayDateString && ymd !== selectedDate;
      })
      .sort((a, b) => {
        const dateA = getFechaYMD(a.fecha) || '';
        const dateB = getFechaYMD(b.fecha) || '';
        return dateA.localeCompare(dateB);
      });
  }, [misPartidos, todayDateString, selectedDate]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handeMonthChange = (month) => {
    setCurrentMonth(month.dateString.substring(0, 7));
  };

  const themeConfig = {
    calendarBackground: isDarkMode ? '#262626' : '#ffffff',
    textSectionTitleColor: isDarkMode ? '#a3a3a3' : '#b6c1cd',
    selectedDayBackgroundColor: '#2563eb',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#2563eb',
    dayTextColor: isDarkMode ? '#d4d4d4' : '#2d4150',
    textDisabledColor: isDarkMode ? '#404040' : '#d9e1e8',
    dotColor: '#2563eb',
    selectedDotColor: '#ffffff',
    arrowColor: '#2563eb',
    monthTextColor: isDarkMode ? '#ffffff' : '#1a1a1a',
    textDayFontWeight: '500',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}>
      <ScrollView
        style={{ flex: 1 }}
        className="pt-4 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor={isDarkMode ? '#ffffff' : '#2563eb'}
          />
        }
      >

        {/* ── Leyenda de Deportes por Color ── */}
        <View className="flex-row flex-wrap justify-between items-center bg-white dark:bg-neutral-800 p-3 rounded-xl border border-[#eaeaea] dark:border-neutral-700 mb-4 shadow-sm">
          <View className="flex-row items-center mr-2 mb-1">
            <View className="w-3 h-3 rounded-full bg-[#22c55e] mr-1.5" />
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fútbol</Text>
          </View>
          <View className="flex-row items-center mr-2 mb-1">
            <View className="w-3 h-3 rounded-full bg-[#f97316] mr-1.5" />
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">Baloncesto</Text>
          </View>
          <View className="flex-row items-center mr-2 mb-1">
            <View className="w-3 h-3 rounded-full bg-[#3b82f6] mr-1.5" />
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">Béisbol</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 rounded-full bg-[#a855f7] mr-1.5" />
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">Voleibol</Text>
          </View>
        </View>

        <View className="rounded-xl overflow-hidden border border-[#eaeaea] dark:border-neutral-700 mb-6 bg-white dark:bg-neutral-800 shadow-sm">
          <Calendar
            onDayPress={handleDayPress}
            onMonthChange={handeMonthChange}
            markingType={'multi-dot'}
            markedDates={markedDates}
            theme={themeConfig}
            firstDay={1}
            enableSwipeMonths={true}
          />
        </View>

        {/* ── Partidos del día seleccionado ── */}
        <View className="mb-6">
          <Text className="text-sm text-[#8a8a8a] dark:text-neutral-500 font-medium uppercase tracking-wider mb-3">
            Partidos {selectedDate === todayDateString ? "de hoy" : `del ${selectedDate}`}
          </Text>

          {selectedDayPartidos.length > 0 ? (
            selectedDayPartidos.map(partido => (
              <PartidoCard
                key={`partido-${partido.id}`}
                partido={partido}
                onPress={() => {
                  if (partido.campeonato_id) {
                    navigation.navigate("Eventos", {
                      screen: "FasesCampeonatoScreen",
                      initial: false,
                      params: {
                        campeonato: {
                          id: partido.campeonato_id,
                          nombre: partido.campeonato_nombre,
                          deporte: partido.campeonato_deporte || partido.deporte,
                          propietario_id: partido.campeonato_propietario_id
                        },
                        readOnly: partido.campeonato_propietario_id != usuario?.id
                      }
                    });
                  }
                }}
              />
            ))
          ) : (
            <View className="p-6 items-center bg-white dark:bg-neutral-800 rounded-xl border border-[#eaeaea] dark:border-neutral-700 border-dashed">
              <Text className="text-sm text-[#8a8a8a] dark:text-neutral-400">
                {selectedDate === todayDateString
                  ? "No hay partidos para hoy."
                  : "No hay partidos para este día."}
              </Text>
            </View>
          )}
        </View>

        {/* ── Próximos partidos ── */}
        <View className="mb-10">
          <Text className="text-sm text-[#8a8a8a] dark:text-neutral-500 font-medium uppercase tracking-wider mb-3">
            Próximos partidos
          </Text>
          {upcomingPartidos.length > 0 ? (
            upcomingPartidos.map(partido => (
              <PartidoCard
                key={`upcoming-partido-${partido.id}`}
                partido={partido}
                onPress={() => {
                  if (partido.campeonato_id) {
                    navigation.navigate("Eventos", {
                      screen: "FasesCampeonatoScreen",
                      params: {
                        campeonato: {
                          id: partido.campeonato_id,
                          nombre: partido.campeonato_nombre,
                          deporte: partido.campeonato_deporte || partido.deporte,
                          propietario_id: partido.campeonato_propietario_id
                        },
                        readOnly: partido.campeonato_propietario_id != usuario?.id
                      }
                    });
                  }
                }}
              />
            ))
          ) : (
            <View className="p-6 items-center bg-white dark:bg-neutral-800 rounded-xl border border-[#eaeaea] dark:border-neutral-700 border-dashed">
              <Text className="text-sm text-[#8a8a8a] dark:text-neutral-400">No hay partidos próximos.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
