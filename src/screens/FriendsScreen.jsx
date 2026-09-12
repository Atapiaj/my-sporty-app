import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { AmistadContext } from '../context/AmistadContext';
import { ThemeContext } from '../context/ThemeContext';

const FriendCard = ({ item, onPressChat }) => (
  <View className="flex-row items-center p-4 bg-white dark:bg-neutral-800 rounded-2xl mb-3 border border-gray-100 dark:border-neutral-700 shadow-sm">
    <View className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/10 items-center justify-center mr-4">
      <Ionicons name="person" size={24} color="#1D4ED8" />
    </View>
    <View className="flex-1">
      <Text className="text-base font-bold text-gray-900 dark:text-white">{item.nombre}</Text>
      <Text className="text-xs text-gray-500 dark:text-neutral-400">{item.correo}</Text>
    </View>
    <TouchableOpacity style={{ padding: 8 }} onPress={onPressChat}>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6B7280" />
    </TouchableOpacity>
  </View>
);

const UserFoundCard = ({ item, onAdd, onCancel }) => (
  <View className="mb-4 p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/50 mb-50 shadow-sm">
    <View className="flex-row items-center mb-4">
       <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center mr-4">
        <Text className="text-white text-xl font-black">{item.nombre.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-black text-gray-900 dark:text-white">{item.nombre}</Text>
        <Text className="text-sm text-blue-600 dark:text-blue-400">{item.correo}</Text>
      </View>
    </View>
    
    <View className="flex-row gap-2">
      <TouchableOpacity 
        onPress={onAdd}
        style={{ flex: 1, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: '#93c5fd', shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }}
      >
        <Text className="text-white font-black text-sm text-center">Enviar Solicitud</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity 
        onPress={onCancel}
        style={{ paddingHorizontal: 20, backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' }}
      >
        <Ionicons name="close" size={20} color="#9CA3AF" />
      </TouchableOpacity> */}
    </View>
  </View>
);

export default function FriendsScreen({ navigation }) {
  const { amigos, cargarAmigos, encontrarUsuarioPorCorreo, enviarSolicitudPorId, loading } = useContext(AmistadContext);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState();
  const [correoNuevo,  setCorreoNuevo] = useState('');
  const [busquedaAmigo, setBusquedaAmigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  
  useEffect(() => {
    cargarAmigos();
  }, [cargarAmigos]);

  const agregarAmigo = async (id) => {
    await enviarSolicitudPorId(id);
    Alert.alert("Solicitud enviada", "Se ha enviado correctamente la solicitud de amistad.");
    setCorreoNuevo('');
    setUsuarioEncontrado(null);
  };

  const buscarUsuarioPorCorreo = async () => {
    if (!correoNuevo.trim()) return;
    setBuscando(true);
    try {
      const res = await encontrarUsuarioPorCorreo(correoNuevo);
      setUsuarioEncontrado(res);
      if (!res) Alert.alert("No encontrado", "No se encontró ningún usuario con ese correo.");
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
    }
  };

  const abrirModalAdd = () => {
    setAddModalVisible(true);
  }

  const usuariosFiltrados = amigos.filter((usuario) => {
    const termino = busquedaAmigo.toLowerCase();
    return (
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.correo.toLowerCase().includes(termino)
    );
  });

  return (
    <SafeAreaView style={{ flex: 1 , backgroundColor: isDarkMode ? "#171717" : "#f9fafb"}} >
      <View style={{ flex: 1 }} className="px-5">
        
      

        {/* Search Bar */}
        <View className="my-6 flex-row align-items-center justify-between gap-3">
          <View className="flex-row flex-1 items-center bg-white dark:bg-neutral-800 rounded-2xl px-4 py-1 border border-gray-100 dark:border-neutral-700 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Buscar amigo..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 h-12 ml-2 text-base text-gray-900 dark:text-white"
              value={busquedaAmigo}
              onChangeText={(text) => setBusquedaAmigo(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <TouchableOpacity onPress={abrirModalAdd} style={{ padding: 4 }}>
            <View className="bg-white dark:bg-neutral-800 rounded-xl px-3 py-3 border border-gray-200 dark:border-neutral-500">
              <Ionicons name="person-add" size={24} color="#1D4ED8"/>
            </View>
          </TouchableOpacity>
        </View>

        {/* Friends List */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Tu Círculo</Text>
            <View className="bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
               <Text className="text-[10px] font-black text-blue-700 dark:text-blue-300">{amigos.length}</Text>
            </View>
          </View>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {amigos.length === 0 ? (
              <View className="py-20 items-center">
                <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 items-center justify-center mb-4">
                   <Ionicons name="people-outline" size={32} color="#D1D5DB" />
                </View>
                <Text className="text-gray-400 dark:text-neutral-500 italic text-center px-10">
                  Aún no tienes amigos en tu círculo. ¡Busca a alguien por su correo!
                </Text>
              </View>
            ) : (
              usuariosFiltrados.map((item) => (
                <FriendCard 
                  key={item.id} 
                  item={item} 
                  onPressChat={() => navigation.navigate('Mensajes', { 
                    screen: 'ChatRoomScreen', 
                    params: { type: 'amigo', target: item },
                    initial: false,
                  })}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 dark:bg-black/60 justify-center items-center">
          <KeyboardAvoidingView className="w-[90%] min-h-[250px] bg-white dark:bg-neutral-800 rounded-xl pt-5 px-5 gap-3"
            // behavior={Platform.OS === "ios" ? "padding" : "paddingvaloa"}
            // keyboardVerticalOffset={Platform.OS === "ios" ? 90 :90}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-[#1a1a1a] dark:text-white">Agregar Amigos</Text>
              <TouchableOpacity onPress={() => {setAddModalVisible(false); setUsuarioEncontrado(); setCorreoNuevo(''); }} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#8a8a8a" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-white dark:bg-neutral-800 rounded-2xl px-4 border border-gray-100 dark:border-neutral-700 shadow-sm">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Buscar por correo..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 h-12 ml-2 text-base text-gray-900 dark:text-white"
                value={correoNuevo}
                onChangeText={setCorreoNuevo}
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={buscarUsuarioPorCorreo}
              />
              {buscando ? (
                <ActivityIndicator color="#1D4ED8" size="small" />
              ) : correoNuevo.length > 0 ? (
                <TouchableOpacity onPress={buscarUsuarioPorCorreo} style={{ padding: 4 }}>
                  <View className="bg-blue-600 rounded-xl px-3 py-1.5">
                    <Text className="text-white font-bold text-xs">Buscar</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

            </View>
            {/* Found User UI */}
            {usuarioEncontrado && (
              <UserFoundCard 
                item={usuarioEncontrado} 
                onAdd={() => agregarAmigo(usuarioEncontrado.id)}
                onCancel={() => { setUsuarioEncontrado(null); setCorreoNuevo(''); }}
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}