import React, { useState, useContext } from "react";
import { View, Text, Switch, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";

const SettingItem = ({ icon, label, description, value, onValueChange, showSwitch = true }) => (
  <View className="flex-row items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-2xl mb-3 border border-gray-100 dark:border-neutral-700 shadow-sm">
    <View className="flex-row items-center flex-1">
      <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
        <Ionicons name={icon} size={22} color="#1D4ED8" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white">{label}</Text>
        {description && <Text className="text-xs text-gray-500 dark:text-neutral-400">{description}</Text>}
      </View>
    </View>
    {showSwitch && (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D5DB", true: "#1D4ED8" }}
        thumbColor="#FFFFFF"
      />
    )}
  </View>
);

export default function ConfiguracionScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const { isDarkMode, toggleTema } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#171717" : "#f9fafb" }}>
      <ScrollView style={{ flex: 1 }} className="px-4 pt-6">


        <View className="my-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3 ml-1">
            Preferencias
          </Text>
          <SettingItem
            icon="notifications-outline"
            label="Notificaciones"
            description="Recibe alertas de tus partidos y equipos"
            value={notificaciones}
            onValueChange={setNotificaciones}
          />
          <SettingItem
            icon="moon-outline"
            label="Modo Oscuro"
            description="Activa el tema oscuro para mayor descanso visual"
            value={isDarkMode}
            onValueChange={toggleTema}
          />
        </View>

        {/* <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3 ml-1">
            Cuenta
          </Text>
          <TouchableOpacity
          onPress={logout}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: isDarkMode ? "#222222" : "#ffffff", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: isDarkMode ? "#374151" : "#f3f4f6", shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mr-3">
                <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-red-600 dark:text-white">Cerrar Sesión</Text>
                <Text className="text-xs text-red-400/80 dark:text-white">Salir de tu cuenta actual</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View> */}

        <View className="items-center mt-4 mb-10">
          <Text className="text-xs text-gray-400 dark:text-neutral-500">Versión 0.8</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
