import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import { getEquiposAmigosParaCampeonatoService, enviarInvitacionCampeonatoService } from '../services/equipoService';
import { getFasesService, crearFaseService, eliminarFaseService, getEquiposInscritosService, getPosicionesFaseService, getEventoById } from '../services/eventoService';
import { ThemeContext } from '../context/ThemeContext';

const FasesCampeonatoScreen = ({ route, navigation }) => {
const { campeonato, readOnly } = route.params || {};
const { usuario } = useContext(AuthContext);
const [campeonatoActual, setCampeonatoActual] = useState(campeonato);
const isOwner = !readOnly && !!usuario && campeonato?.propietario_id == usuario?.id;
const [fases, setFases] = useState([]);
const [posicionesLiga, setPosicionesLiga] = useState({});
const [modalVisible, setModalVisible] = useState(false);
const [nuevaFase, setNuevaFase] = useState('');
const [metodoFase, setMetodoFase] = useState('');
const [numeroGrupos, setNumeroGrupos] = useState('');
const [clasificadosPorGrupo, setClasificadosPorGrupo] = useState('');
const [errorGrupo, setErrorGrupo] = useState('');
const [equiposInscritos, setEquiposInscritos] = useState([]);

// States for Inviting Friends' Teams
const [modalAmigosVisible, setModalAmigosVisible] = useState(false);
const [equiposAmigos, setEquiposAmigos] = useState([]);
const [loadingAmigos, setLoadingAmigos] = useState(false);
const [busquedaEquipo, setBusquedaEquipo] = useState('');

const { isDarkMode } = useContext(ThemeContext);

useEffect(() => {
  cargarDatosIniciales();
}, [campeonato]);

const cargarDatosIniciales = async () => {
  if (campeonatoActual?.id) {
    try {
      // Refresh campeonato state
      try {
        const campData = await getEventoById(campeonatoActual.id);
        if (campData) {
          setCampeonatoActual(campData);
        }
      } catch (err) {
        console.error(err);
      }

      const dbFases = await getFasesService(campeonatoActual.id);

      const calcularEquiposRestantesFase = (f) => {
        const metodo = f.tipo === 'fase_grupos' ? 'grupos' : (f.metodo || f.tipo);
        const equiposIniciales = f.numero_equipos;
        const tamanoGrupo = parseInt(f.tamano_grupo, 10);
        const clasificados = parseInt(f.clasificados_por_grupo || f.clasificadosPorGrupo, 10);
        const numGrupos = parseInt(f.numero_grupos || f.numeroGrupos, 10) || (tamanoGrupo ? Math.floor(equiposIniciales / tamanoGrupo) : 0);

        if (metodo === 'liga' || metodo === 'eliminatoria') return 1;
        if (metodo === 'grupos') {
          if (clasificados && numGrupos) {
            return numGrupos * clasificados;
          }
          if (tamanoGrupo && clasificados) {
            const grupos = equiposIniciales / tamanoGrupo;
            return grupos * clasificados;
          }
        }
        return 1;
      };

      const mappedFases = dbFases.map(f => ({
        id: f.id,
        nombre: f.nombre,
        metodo: f.tipo === 'fase_grupos' ? 'grupos' : f.tipo,
        equiposIniciales: f.numero_equipos,
        equiposRestantes: calcularEquiposRestantesFase(f),
        numeroGrupos: f.numero_grupos || (f.tamano_grupo ? Math.floor(f.numero_equipos / f.tamano_grupo) : ''),
        tamanoGrupo: f.tamano_grupo || '',
        clasificadosPorGrupo: f.clasificados_por_grupo || '',
      }));
      setFases(mappedFases);

      const dbEquipos = await getEquiposInscritosService(campeonatoActual.id);
      setEquiposInscritos(dbEquipos);

      // Fetch points for `liga` to display the leader
      const positions = {};
      const getGroupLabel = (item) => {
        return (
          item.grupo_nombre ||
          item.grupo ||
          item.group_name ||
          item.group ||
          item.grupo_id ||
          item.group_id ||
          '1'
        );
      };

      const orderGroups = (a, b) => {
        const parsedA = parseInt(a, 10);
        const parsedB = parseInt(b, 10);
        if (!Number.isNaN(parsedA) && !Number.isNaN(parsedB)) {
          return parsedA - parsedB;
        }
        return String(a).localeCompare(String(b));
      };

      const extractGroupLeaders = (posFase) => {
        if (!posFase || posFase.length === 0) return [];

        // Si la respuesta ya viene agrupada del backend (nueva estructura)
        if (posFase[0] && posFase[0].posiciones) {
          return posFase.map((grupo) => {
            const sorted = grupo.posiciones.sort((a, b) => {
              if (b.pts !== a.pts) return b.pts - a.pts;
              if ((b.dg || 0) !== (a.dg || 0)) return (b.dg || 0) - (a.dg || 0);
              return (b.gf || 0) - (a.gf || 0);
            });
            return { ...sorted[0], grupo: grupo.grupo, grupo_nombre: grupo.nombre };
          });
        }

        // Estructura anterior: posiciones planas
        const groupMap = {};
        posFase.forEach((pos) => {
          const grupo = String(getGroupLabel(pos) || '1');
          if (!groupMap[grupo]) groupMap[grupo] = [];
          groupMap[grupo].push(pos);
        });
        return Object.keys(groupMap)
          .sort(orderGroups)
          .map((grupo) => {
            const sorted = groupMap[grupo].sort((a, b) => {
              if (b.pts !== a.pts) return b.pts - a.pts;
              if ((b.dg || 0) !== (a.dg || 0)) return (b.dg || 0) - (a.dg || 0);
              return (b.gf || 0) - (a.gf || 0);
            });
            return { ...sorted[0], grupo };
          });
      };

      for (const f of mappedFases) {
        if (f.metodo === 'liga' || f.metodo === 'grupos') {
           const posFase = await getPosicionesFaseService(f.id);
           if (posFase && posFase.length > 0) {
              positions[f.id] = extractGroupLeaders(posFase);
           }
        }
      }
      setPosicionesLiga(positions);
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }
};


const calcularDivisores = (num) => {
  let divisores = [];
  for (let i = 2; i <= num; i++) {
    if (num % i === 0) {
      divisores.push(i);
    }
  }
  return divisores;
};

const abrirModalAmigos = async () => {
  setBusquedaEquipo('');
  setModalAmigosVisible(true);
  setLoadingAmigos(true);
  const campId = campeonatoActual?.id || campeonato?.id;
  const campDeporte = campeonatoActual?.deporte || campeonato?.deporte;
  try {
    const response = await getEquiposAmigosParaCampeonatoService(campId);
    let data = response.data || response;
    // Filtrar por el deporte del evento
    if (campDeporte) {
      data = data.filter(equipo => 
        equipo.deporte && 
        equipo.deporte.toLowerCase() === campDeporte.toLowerCase()
      );
    }
    setEquiposAmigos(data);
  } catch (error) {
    if (error.response?.status === 404) {
      setEquiposAmigos([]);
    } else {
      console.error('Error fetching friends teams:', error);
    }
  } finally {
    setLoadingAmigos(false);
  }
};

const invitarEquipo = async (equipo) => {
  const isMyTeam = equipo.propietario_id === usuario?.id;
  const campId = campeonatoActual?.id || campeonato?.id;
  try {
    const res = await enviarInvitacionCampeonatoService(campId, equipo.propietario_id, equipo.id);
    if (isMyTeam || res?.inscrito) {
      alert('Equipo ' + equipo.nombre + ' inscrito correctamente al evento');
      await cargarDatosIniciales();
    } else {
      alert('Invitación enviada a ' + equipo.nombre);
    }
    // Remove the team from the list so they can't be invited again immediately
    setEquiposAmigos(prev => prev.filter(e => e.id !== equipo.id));
  } catch (error) {
    console.error('Error invitar equipo:', error);
    alert('Error al invitar o inscribir equipo');
  }
};

const agregarFase = () => {
  if (!nuevaFase.trim() || !metodoFase) return;

  const equiposAnteriores = fases.length === 0 
    ? campeonato.numero_equipos 
    : fases[fases.length - 1].equiposRestantes;

  let equiposRestantes = equiposAnteriores;

  if (equiposAnteriores <= 1) {
    alert('El campeonato ya cuenta con 1 solo equipo victorioso (campeón). No se pueden agregar más fases.');
    return;
  }

  if (metodoFase === "liga" || metodoFase === "eliminatoria") {
    equiposRestantes = 1;
  } else if (metodoFase === "grupos") {
    const grupos = parseInt(numeroGrupos, 10);
    const clasificados = parseInt(clasificadosPorGrupo, 10);

    if (!grupos || !clasificados) {
      setErrorGrupo("Debes ingresar valores válidos.");
      return;
    }
    if (grupos < 2 || grupos > equiposAnteriores) {
      setErrorGrupo("El número de grupos debe ser al menos 2 y menor o igual al número de equipos.");
      return;
    }
    if (grupos % 2 !== 0) {
      setErrorGrupo("El número de grupos debe ser par.");
      return;
    }
    if (equiposAnteriores % grupos !== 0) {
      setErrorGrupo("El número de grupos debe dividir equitativamente los equipos.");
      return;
    }

    const tamano = equiposAnteriores / grupos;
    if (tamano < 2) {
      setErrorGrupo("Cada grupo debe tener al menos 2 equipos.");
      return;
    }
    if (clasificados >= tamano) {
      setErrorGrupo("Los clasificados deben ser menores que el tamaño de cada grupo.");
      return;
    }

    equiposRestantes = grupos * clasificados;
  }

  const nuevaFaseParams = {
    campeonato_id: campeonato.id,
    nombre: nuevaFase.trim(),
    tipo: metodoFase === 'grupos' ? 'fase_grupos' : metodoFase,
    numero_equipos: equiposAnteriores,
    orden: fases.length + 1,
    ...(metodoFase === 'grupos' ? {
      numero_grupos: parseInt(numeroGrupos, 10),
      tamano_grupo: equiposAnteriores / parseInt(numeroGrupos, 10),
      clasificados_por_grupo: parseInt(clasificadosPorGrupo, 10),
    } : {}),
  };
  
  crearFaseService(nuevaFaseParams)
    .then(() => {
      cargarDatosIniciales();
      setNuevaFase('');
      setMetodoFase('');
      setNumeroGrupos('');
      setClasificadosPorGrupo('');
      setErrorGrupo('');
      setModalVisible(false);
    })
    .catch(error => {
      console.error('Error creando fase:', error);
      alert('Hubo un error al agregar la fase.');
    });
};

if (!campeonatoActual) {
  return <Text>No se encontró el campeonato.</Text>;
}

const eliminarFase = (idFase) => {
  if(!idFase) return;
  Alert.alert(
    '¿Eliminar fase?',
    'Esta acción no se puede deshacer.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarFaseService(idFase);
            cargarDatosIniciales();
          } catch (error) {
            console.error('Error eliminando fase:', error);
          }
        },
      },
    ]
  );
};

  const renderBadge = (text, color) => (
    <View style={{ backgroundColor: color + '15' }} className="px-2 py-1 rounded mr-2 mb-2 dark:bg-opacity-20">
      <Text style={{ color }} className="text-xs font-semibold dark:opacity-90 capitalize">{text}</Text>
    </View>
  );

  const isCampeonato = campeonato?.tipo_actividad !== 'partido';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}>
      <View style={{ flex: 1 }} className="px-5 pt-4 bg-[#f9fafb] dark:bg-[#171717]">
        <View className="flex-row items-center mb-5">
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4, borderRadius: 999 }}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} className="dark:text-white" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a1a1a] dark:text-white flex-1" numberOfLines={1}>
            {campeonatoActual?.nombre || "Sin nombre"}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header content from original ListHeaderComponent */}
          <View className="bg-white dark:bg-neutral-800 rounded-xl border border-[#eaeaea] dark:border-neutral-700 p-4 mb-6">
            {campeonatoActual?.descripcion ? (
              <Text className="text-sm text-[#6a6a6a] dark:text-neutral-400 mb-4 leading-5">{campeonatoActual.descripcion}</Text>
            ) : null}
            
            <View className="flex-row flex-wrap mb-4">
              {renderBadge(campeonatoActual?.estado || "borrador", campeonatoActual?.estado === 'activo' || campeonatoActual?.estado === 'publicado' ? '#28a745' : campeonatoActual?.estado === 'finalizado' ? '#8a2be2' : '#6c757d')}
              {renderBadge(campeonatoActual?.privacidad || "público", '#007bff')}
              {campeonatoActual?.inscripciones_abiertas === '1' && renderBadge('Inscripciones abiertas', '#28a745')}
            </View>

            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] mb-3">
                 <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">ID</Text>
                 <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.id || "-"}</Text>
              </View>
              <View className="w-[48%] mb-3">
                 <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Deporte</Text>
                 <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200 capitalize">{campeonatoActual?.deporte || "-"}</Text>
              </View>
              <View className="w-[48%] mb-3">
                 <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Jugadores</Text>
                 <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.numero_jugadores || "0"} / {campeonatoActual?.numero_suplentes || "0"} sup</Text>
              </View>
              <View className="w-[48%] mb-3">
                 <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Inicia</Text>
                 <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.fecha_inicio || "-"}</Text>
              </View>
              
              {isCampeonato && (
                <>
                  <View className="w-[48%] mb-3">
                    <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Termina</Text>
                    <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.fecha_fin || "-"}</Text>
                  </View>
                  <View className="w-[48%] mb-3">
                    <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Equipos</Text>
                    <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.numero_equipos || "0"}</Text>
                  </View>
                </>
              )}
              {campeonatoActual?.telefono_contacto ? (
                <View className="w-[48%] mb-3">
                  <Text className="text-[11px] text-[#8a8a8a] dark:text-neutral-500 mb-1 uppercase tracking-wider">Contacto</Text>
                  <Text className="text-[13px] font-medium text-[#1a1a1a] dark:text-neutral-200">{campeonatoActual?.telefono_contacto}</Text>
                </View>
              ) : null}
            </View>
            
            {isOwner && (
              <TouchableOpacity
                onPress={abrirModalAmigos}
                disabled={equiposInscritos.length >= (campeonato?.numero_equipos || 0)}
                style={{
                  paddingVertical: 12, borderRadius: 8,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  marginTop: 8, marginBottom: 8,
                  backgroundColor: equiposInscritos.length >= (campeonato?.numero_equipos || 0) ? '#9ca3af' : '#4f46e5',
                }}
              >
                 <Ionicons name="people-outline" size={18} color="#fff" />
                 <Text className="text-white font-semibold text-sm ml-2">
                    {equiposInscritos.length >= (campeonato?.numero_equipos || 0) ? 'Cupos Llenos' : 'Invitar o Inscribir Equipos'}
                 </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3 mt-4">Equipos Inscritos ({equiposInscritos.length})</Text>
          {equiposInscritos.length > 0 ? (
            <View className="mb-4">
              {equiposInscritos.map((equipo) => (
                <TouchableOpacity
                  key={equipo.id}
                  className="flex-row items-center p-3 bg-white dark:bg-neutral-800 rounded-lg border border-[#eaeaea] dark:border-neutral-700 mb-2"
                  onPress={() => {
                    navigation.navigate("EquipoMiembrosScreen", {
                      equipo: { ...equipo, id: equipo.equipo_id, nombre: equipo.equipo_nombre },
                      isOwner: false
                    });
                  }}
                >
                   <View className="flex-1">
                      <Text className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">{equipo.equipo_nombre}</Text>
                   </View>
                   <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="p-4 items-center bg-white dark:bg-neutral-800 rounded-lg border border-[#eaeaea] dark:border-neutral-700 border-dashed mb-4">
              <Text className="text-sm text-[#8a8a8a] dark:text-neutral-400">Ningún equipo se ha inscrito todavía.</Text>
            </View>
          )}

          <Text className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3 mt-2">
            {isCampeonato ? "Fases del campeonato" : "Encuentro Programado"}
          </Text>
          
          {fases.length === 0 ? (
            <View className="p-6 items-center bg-white dark:bg-neutral-800 rounded-xl border border-[#eaeaea] dark:border-neutral-700 border-dashed">
              <Text className="text-sm text-[#8a8a8a] dark:text-neutral-400">No hay fases agregadas aún.</Text>
            </View>
          ) : (
            fases.map((item, index) => (
              <View key={index} className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-[#eaeaea] dark:border-neutral-700 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[15px] font-semibold text-[#1a1a1a] dark:text-neutral-200 mb-1">
                      {isCampeonato ? `${index + 1}. ` : ''}{item.nombre}
                    </Text>
                    {isCampeonato && (
                      <Text className="text-[13px] text-[#6a6a6a] dark:text-neutral-400 mt-[2px]">
                        Método: <Text className="font-medium text-[#1a1a1a] dark:text-neutral-300 capitalize">{item.metodo}</Text>
                        {item.metodo === "grupos" && ` (${item.numeroGrupos} grupos de ${item.tamanoGrupo}, ${item.clasificadosPorGrupo} clas. por grupo)`}
                      </Text>
                    )}
                    <Text className="text-[13px] text-[#6a6a6a] dark:text-neutral-400 mt-[2px]">
                      Equipos: {item.metodo === 'grupos'
                        ? `${item.equiposIniciales} → ${item.equiposRestantes} clasificados${item.clasificadosPorGrupo ? ` (${item.clasificadosPorGrupo} por grupo)` : ''}`
                        : `${item.equiposIniciales} → 1 campeón`}
                    </Text>
                  </View>

                  {/* Buttons right */}
                  <View className="flex-row items-center space-x-2">
                    <TouchableOpacity onPress={() => navigation.navigate('FixtureFaseScreen', { fase: item, campeonato: campeonatoActual, readOnly: !isOwner })} style={{ backgroundColor: isDarkMode ? '#312e81' : '#e0e7ff', padding: 8, borderRadius: 8 }}>
                      <Ionicons name="calendar-outline" size={20} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
                    </TouchableOpacity>
                    {isCampeonato && isOwner && (
                      <TouchableOpacity onPress={() => eliminarFase(item.id)} style={{ backgroundColor: isDarkMode ? '#450a0a' : '#fff1f2', padding: 8, borderRadius: 8 }}>
                        <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#f87171' : '#ff4d4f'} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Leader badge */}
                {posicionesLiga[item.id] && posicionesLiga[item.id].length > 0 && (
                  <View className="mt-4 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30 shadow-sm">
                     <Text className="text-[11px] text-yellow-700 dark:text-yellow-500 font-bold uppercase mb-1 tracking-wider">
                        {item.metodo === 'grupos' ? '⭐ Líderes por grupo' : campeonatoActual?.estado === 'finalizado' ? '🏆 Campeón' : '⭐ Líder Actual de Liga'}
                     </Text>
                     {item.metodo === 'grupos' ? (
                       posicionesLiga[item.id].map((lider, idx) => (
                         <View key={idx} className="flex-row justify-between items-center mb-2 last:mb-0">
                           <Text className="text-sm font-semibold text-[#1a1a1a] dark:text-white truncate flex-1" numberOfLines={1}>Grupo {lider.grupo}: {lider.nombre}</Text>
                           <View className="flex-row items-center border-l pl-2 border-yellow-200 dark:border-yellow-800 ml-2">
                             <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 mr-2 uppercase tracking-wide">DG: {lider.dg > 0 ? '+'+lider.dg : lider.dg}</Text>
                             <Text className="text-[15px] font-black text-indigo-600 dark:text-indigo-400">{lider.pts} PTS</Text>
                           </View>
                         </View>
                       ))
                     ) : (
                       <View className="flex-row justify-between items-center">
                          <Text className="text-sm font-semibold text-[#1a1a1a] dark:text-white truncate flex-1" numberOfLines={1}>{posicionesLiga[item.id][0].nombre}</Text>
                          <View className="flex-row items-center border-l pl-2 border-yellow-200 dark:border-yellow-800 ml-2">
                             <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 mr-2 uppercase tracking-wide">DG: {posicionesLiga[item.id][0].dg > 0 ? '+'+posicionesLiga[item.id][0].dg : posicionesLiga[item.id][0].dg}</Text>
                             <Text className="text-[15px] font-black text-indigo-600 dark:text-indigo-400">{posicionesLiga[item.id][0].pts} PTS</Text>
                          </View>
                       </View>
                     )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/40 dark:bg-black/60 justify-center items-center">
            <View className="w-[90%] bg-white dark:bg-neutral-800 rounded-xl p-6 elevation-0 border dark:border-neutral-700">
              <Text className="text-[15px] font-semibold mt-4 mb-2 text-[#1a1a1a] dark:text-white">Agregar nueva fase:</Text>
              <TextInput
                className="border border-[#eaeaea] dark:border-neutral-600 rounded-md p-2.5 mb-3 bg-[#fafafa] dark:bg-neutral-900 text-sm text-[#1a1a1a] dark:text-white"
                value={nuevaFase}
                onChangeText={setNuevaFase}
                placeholder="Nombre de la fase"
                placeholderTextColor="#8a8a8a"
              />
              <View className="flex-row justify-around mb-4">
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, marginHorizontal: 4,
                    backgroundColor: metodoFase === 'liga' ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : (isDarkMode ? '#262626' : '#f5f5f5'),
                    borderWidth: 1, borderColor: metodoFase === 'liga' ? (isDarkMode ? '#3b82f6' : '#93c5fd') : (isDarkMode ? '#404040' : '#eaeaea'),
                  }}
                  onPress={() => setMetodoFase('liga')}
                >
                  <Text style={{ color: metodoFase === 'liga' ? (isDarkMode ? '#93c5fd' : '#1e40af') : (isDarkMode ? '#e5e5e5' : '#1a1a1a'), fontWeight: '600' }}>Liga</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, marginHorizontal: 4,
                    backgroundColor: metodoFase === 'eliminatoria' ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : (isDarkMode ? '#262626' : '#f5f5f5'),
                    borderWidth: 1, borderColor: metodoFase === 'eliminatoria' ? (isDarkMode ? '#3b82f6' : '#93c5fd') : (isDarkMode ? '#404040' : '#eaeaea'),
                  }}
                  onPress={() => setMetodoFase('eliminatoria')}
                >
                  <Text style={{ color: metodoFase === 'eliminatoria' ? (isDarkMode ? '#93c5fd' : '#1e40af') : (isDarkMode ? '#e5e5e5' : '#1a1a1a'), fontWeight: '600' }}>Eliminatoria</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, marginHorizontal: 4,
                    backgroundColor: metodoFase === 'grupos' ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : (isDarkMode ? '#262626' : '#f5f5f5'),
                    borderWidth: 1, borderColor: metodoFase === 'grupos' ? (isDarkMode ? '#3b82f6' : '#93c5fd') : (isDarkMode ? '#404040' : '#eaeaea'),
                  }}
                  onPress={() => setMetodoFase('grupos')}
                >
                  <Text style={{ color: metodoFase === 'grupos' ? (isDarkMode ? '#93c5fd' : '#1e40af') : (isDarkMode ? '#e5e5e5' : '#1a1a1a'), fontWeight: '600' }}>Fase de grupos</Text>
                </TouchableOpacity>
              </View>
              <Button
                title="Agregar fase"
                onPress={agregarFase}
                disabled={
                  !nuevaFase.trim() ||
                  !metodoFase ||
                  (
                    fases.length === 0
                      ? campeonato.numero_equipos
                      : fases[fases.length - 1].equiposRestantes
                  ) <= 1
                }
              />
              {metodoFase === 'grupos' && (
                <>
                  <Text className="font-semibold mb-1.5 mt-2 dark:text-neutral-200">
                    Número de grupos:
                  </Text>
                  <View className="border border-[#ccc] dark:border-neutral-600 rounded-md mb-3 pb-1.5 pt-1.5 dark:bg-neutral-900">
                    <Picker
                      selectedValue={numeroGrupos}
                      onValueChange={(value) => setNumeroGrupos(value)}
                      style={{ borderWidth:0, color: isDarkMode ? '#ffffff' : '#1a1a1a' }}
                      dropdownIconColor={isDarkMode ? '#ffffff' : '#1a1a1a'}
                    >
                      <Picker.Item label="Seleccione número de grupos" value="" color={isDarkMode ? '#a3a3a3' : '#1a1a1a'} />
                      {calcularDivisores(
                        fases.length === 0 ? campeonato.numero_equipos : fases[fases.length - 1].equiposRestantes
                      )
                        .filter((div) => {
                          const equiposActuales = fases.length === 0 ? campeonato.numero_equipos : fases[fases.length - 1].equiposRestantes;
                          return div % 2 === 0 && equiposActuales / div >= 2;
                        })
                        .map((div, idx) => (
                          <Picker.Item key={idx} label={`${div}`} value={div?.toString()} color={isDarkMode ? '#ffffff' : '#1a1a1a'} />
                        ))}
                    </Picker>
                  </View>

                  {numeroGrupos ? (
                    <Text className="text-sm text-[#6a6a6a] dark:text-neutral-400 mb-2">
                      Equipos por grupo: {Math.floor((fases.length === 0 ? campeonato.numero_equipos : fases[fases.length - 1].equiposRestantes) / parseInt(numeroGrupos, 10))}
                    </Text>
                  ) : null}

                  <TextInput
                    className="border border-[#eaeaea] dark:border-neutral-600 rounded-md p-2.5 mb-3 bg-[#fafafa] dark:bg-neutral-900 text-sm text-[#1a1a1a] dark:text-white"
                    value={clasificadosPorGrupo}
                    onChangeText={setClasificadosPorGrupo}
                    placeholder="Clasificados por grupo (ej: 2)"
                    placeholderTextColor="#8a8a8a"
                    keyboardType="numeric"
                  />
                  {errorGrupo ? <Text className="text-red-500">{errorGrupo}</Text> : null}
                </>
              )}
              <View className="mt-3">
                <Button title="Cancelar" color="#888" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for Inviting Friends / Adding Own Teams */}
        <Modal
          visible={modalAmigosVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalAmigosVisible(false)}
        >
          <View className="flex-1 bg-black/40 dark:bg-black/60 justify-end">
            <KeyboardAvoidingView className="w-full h-2/3 bg-white dark:bg-neutral-800 rounded-t-3xl pt-5 pb-8 px-5 mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-[#1a1a1a] dark:text-white">Invitar o Inscribir Equipos</Text>
                <TouchableOpacity onPress={() => setModalAmigosVisible(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color="#8a8a8a" />
                </TouchableOpacity>
              </View>

              {/* Search input by team name */}
              <View className="flex-row items-center bg-[#f3f4f6] dark:bg-neutral-900 border border-[#eaeaea] dark:border-neutral-700 rounded-xl px-3 py-2 mb-3">
                <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-[#1a1a1a] dark:text-white p-0"
                  placeholder="Buscar por nombre de equipo..."
                  placeholderTextColor="#9ca3af"
                  value={busquedaEquipo}
                  onChangeText={setBusquedaEquipo}
                  autoCapitalize="none"
                />
                {busquedaEquipo.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setBusquedaEquipo('')} style={{ padding: 2 }}>
                    <Ionicons name="close-circle" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              
              {loadingAmigos ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-500">Cargando equipos...</Text>
                </View>
              ) : equiposAmigos.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-500">No se encontraron equipos disponibles para este deporte.</Text>
                </View>
              ) : equiposAmigos.filter(e => e.nombre?.toLowerCase().includes(busquedaEquipo.trim().toLowerCase())).length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="search-outline" size={32} color="#9ca3af" style={{ marginBottom: 6 }} />
                  <Text className="text-gray-500 text-center">No se encontraron equipos que coincidan con "{busquedaEquipo}".</Text>
                </View>
              ) : (
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                >
                  {equiposAmigos
                    .filter(e => e.nombre?.toLowerCase().includes(busquedaEquipo.trim().toLowerCase()))
                    .map((item) => {
                      const isMyTeam = item.propietario_id === usuario?.id;
                      const ownerName = isMyTeam
                        ? `${usuario?.nombre || 'Tú'} (Tú)`
                        : (item.propietario_nombre || 'Desconocido');

                      return (
                        <View key={item.id} className="flex-row items-center justify-between bg-[#fafafa] dark:bg-neutral-900 p-3.5 rounded-xl border border-[#eaeaea] dark:border-neutral-700 mb-3">
                          <View className="flex-1 mr-3">
                            <Text className="font-bold text-[15px] text-[#1a1a1a] dark:text-white mb-0.5">{item.nombre}</Text>
                            <View className="flex-row items-center flex-wrap gap-y-1">
                              <Text className="text-xs text-gray-500 capitalize">{item.deporte}</Text>
                              <Text className="text-xs text-gray-400 mx-1.5">•</Text>
                              <View className="flex-row items-center">
                                <Ionicons name="person-circle-outline" size={13} color="#6366f1" style={{ marginRight: 3 }} />
                                <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  Dueño: {ownerName}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity 
                            style={{ 
                              backgroundColor: isMyTeam ? '#059669' : '#4f46e5', 
                              paddingHorizontal: 16, 
                              paddingVertical: 8, 
                              borderRadius: 8 
                            }}
                            onPress={() => invitarEquipo(item)}
                          >
                            <Text className="text-white text-xs font-semibold">
                              {isMyTeam ? 'Inscribir' : 'Invitar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                </ScrollView>
              )}
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {isCampeonato && isOwner && (
          <View className="absolute bottom-6 left-0 right-0 items-center">
            <TouchableOpacity
              style={{
                backgroundColor: (fases.length > 0 && fases[fases.length - 1].equiposRestantes === 1)
                  ? (isDarkMode ? '#404040' : '#9ca3af')
                  : '#007bff',
                paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8
              }}
              onPress={() => setModalVisible(true)}
              disabled={
                (
                  fases.length === 0
                    ? campeonato.numero_equipos
                    : fases[fases.length - 1].equiposRestantes
                ) <= 1
              }
            >
              <Text className="text-white font-semibold text-[15px]">
                {(fases.length > 0 && fases[fases.length - 1].equiposRestantes === 1)
                  ? 'Campeonato Concluido (1 Campeón)'
                  : 'Agregar Fase'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FasesCampeonatoScreen;
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   Button,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';

// const generateLigaFixture = (teams) => {
//   // Liga: todos contra todos
//   const fixture = [];
//   for (let i = 0; i < teams.length; i++) {
//     for (let j = i + 1; j < teams.length; j++) {
//       fixture.push({
//         match: `${teams[i]} vs ${teams[j]}`,
//         round: 'Fase de Liga',
//       });
//     }
//   }
//   return fixture;
// };

// const generateEliminatoriaFixture = (teams) => {
//   // Eliminatoria: emparejamientos directos
//   const fixture = [];
//   if (teams.length % 2 !== 0) {
//     teams.push('Descanso');
//   }
//   for (let i = 0; i < teams.length; i += 2) {
//     fixture.push({
//       match: `${teams[i]} vs ${teams[i + 1]}`,
//       round: 'Eliminatoria',
//     });
//   }
//   return fixture;
// };

// const FasesCampeonatoScreen = ({ route }) => {
//   const { campeonato } = route.params || {};
//   const [teams, setTeams] = useState([]);
//   const [newTeam, setNewTeam] = useState('');
//   const [method, setMethod] = useState('');
//   const [fixture, setFixture] = useState([]);

//   const addTeam = () => {
//     if (!newTeam.trim()) return;
//     setTeams([...teams, newTeam.trim()]);
//     setNewTeam('');
//   };

//   const handleGenerateFixture = () => {
//     if (teams.length < 2) {
//       Alert.alert('Agrega al menos dos equipos');
//       return;
//     }
//     let f;
//     if (method === 'liga') f = generateLigaFixture(teams);
//     else if (method === 'eliminatoria') f = generateEliminatoriaFixture(teams);
//     else {
//       Alert.alert('Selecciona un método de fixture');
//       return;
//     }
//     setFixture(f);
//   };

//   if (!campeonato) {
//     return <Text>No se encontró el campeonato.</Text>;
//   }

//   // return (
//     {/*<View style={styles.container}>
//       <Text style={styles.title}>{campeonato?.nombre || "Sin nombre"}</Text>
//       <Text style={styles.subtitle}>Agregar equipos participantes:</Text>

//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           value={newTeam}
//           onChangeText={setNewTeam}
//           placeholder="Nombre del equipo"
//         />
//         <Button title="Agregar" onPress={addTeam} />
//       </View>

//       <FlatList
//         data={teams}
//         keyExtractor={(item, idx) => item + idx}
//         renderItem={({ item }) => (
//           <Text style={styles.teamItem}>{item}</Text>
//         )}
//         ListEmptyComponent={<Text>No hay equipos agregados aún.</Text>}
//       />

      

//       <Text style={styles.subtitle}>Selecciona método de fixture:</Text>
//       <View
//         style={styles.buttonRow}
//       >
//         <TouchableOpacity
//           style={[
//             styles.selectButton,
//             method === 'liga' && styles.selectedButton,
//           ]}
//           onPress={() => setMethod('liga')}
//         >
//           <Text>Liga</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.selectButton,
//             method === 'eliminatoria' && styles.selectedButton,
//           ]}
//           onPress={() => setMethod('eliminatoria')}
//         >
//           <Text>Eliminatoria</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.selectButton,
//             method === 'grupos' && styles.selectedButton,
//           ]}
//           onPress={() => setMethod('grupos')}
//         >
//           <Text>Fase de grupos</Text>
//         </TouchableOpacity>
//       </View>

//       <Button
//         title="Generar Fixture"
//         onPress={handleGenerateFixture}
//         disabled={teams.length < 2 || !method}
//       />

//       {fixture.length > 0 && (
//         <>
//           <Text style={styles.subtitle}>Fixture generado:</Text>
//           <FlatList
//             data={fixture}
//             keyExtractor={(_, idx) => idx.toString()}
//             renderItem={({ item }) => (
//               <Text style={styles.fixtureItem}>
//                 {item.round}: {item.match}
//               </Text>
//             )}
//           />
//         </>
//       )}
//     </View>*/}
//     <View style={styles.container}>
//       <Text style={styles.title}>{campeonato?.nombre || "Sin nombre"}</Text>
//       <Text style={styles.subtitle}>Fases del campeonato:</Text>

//       <FlatList
//         data={fixture}
//         keyExtractor={(_, idx) => idx.toString()}
//         renderItem={({ item }) => (
//           <Text style={styles.fixtureItem}>
//             {item.round}: {item.match}
//           </Text>
//         )}
//         ListEmptyComponent={<Text>No hay fixture generado aún.</Text>}
//       />

//       <FasesList />
//     </View>

//     // Componente para manejar las fases
//     function FasesList() {
//       const [fases, setFases] = useState([]);
//       const [nuevaFase, setNuevaFase] = useState('');
//       const [metodoFase, setMetodoFase] = useState('');

//       const agregarFase = () => {
//         if (!nuevaFase.trim() || !metodoFase) return;
//         setFases([
//           ...fases,
//           { nombre: nuevaFase.trim(), metodo: metodoFase }
//         ]);
//         setNuevaFase('');
//         setMetodoFase('');
//       };

//       return (
//         <View>
//           <Text style={styles.subtitle}>Agregar nueva fase:</Text>
//           <View style={styles.inputRow}>
//             <TextInput
//               style={styles.input}
//               value={nuevaFase}
//               onChangeText={setNuevaFase}
//               placeholder="Nombre de la fase"
//             />
//           </View>
//           <View style={styles.buttonRow}>
//             <TouchableOpacity
//               style={[
//                 styles.selectButton,
//                 metodoFase === 'liga' && styles.selectedButton,
//               ]}
//               onPress={() => setMetodoFase('liga')}
//             >
//               <Text>Liga</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.selectButton,
//                 metodoFase === 'eliminatoria' && styles.selectedButton,
//               ]}
//               onPress={() => setMetodoFase('eliminatoria')}
//             >
//               <Text>Eliminatoria</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.selectButton,
//                 metodoFase === 'grupos' && styles.selectedButton,
//               ]}
//               onPress={() => setMetodoFase('grupos')}
//             >
//               <Text>Fase de grupos</Text>
//             </TouchableOpacity>
//           </View>
//           <Button
//             title="Agregar fase"
//             onPress={agregarFase}
//             disabled={!nuevaFase.trim() || !metodoFase}
//           />

//           <Text style={styles.subtitle}>Lista de fases:</Text>
//           <FlatList
//             data={fases}
//             keyExtractor={(_, idx) => idx.toString()}
//             renderItem={({ item, index }) => (
//               <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
//                 <Text style={{ flex: 1 }}>
//                   {index + 1}. {item.nombre} ({item.metodo})
//                 </Text>
//               </View>
//             )}
//             ListEmptyComponent={<Text>No hay fases agregadas aún.</Text>}
//           />
//         </View>
//       );
//     }
// //   );
// // };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16, backgroundColor: '#fff' },
//   title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
//   subtitle: { fontSize: 16, fontWeight: '600', marginTop: 18, marginBottom: 8 },
//   inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
//   input: {
//     flex: 1,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 6,
//     padding: 8,
//     marginRight: 8,
//   },
//   teamItem: { fontSize: 15, paddingVertical: 3 },
//   buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
//   selectButton: {
//     padding: 10,
//     borderRadius: 6,
//     backgroundColor: '#f0f0f0',
//   },
//   selectedButton: { backgroundColor: '#cce5ff' },
//   fixtureItem: { fontSize: 15, marginVertical: 3, color: '#444' },
// });

// export default FasesCampeonatoScreen;