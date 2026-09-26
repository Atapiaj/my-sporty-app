import React, { useContext } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { View, Text, SafeAreaView, ScrollView, Pressable } from "react-native";
import StackNavigator from "./EventoStack";
import HomeStack from "./HomeStack";
import PerfilScreen from "../screens/PerfilScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import EventoStack from "./EventoStack"; // stack con pantalla oculta
import EventosStack from "./EventosStack";
import EquipoStack from "./EquipoStack";
import CalendarioScreen from "../screens/CalendarioScreen";
import FriendsScreen from "../screens/FriendsScreen";
import EquiposScreen from "../screens/EquiposScreen";
import CrearEquiposScreen from "../screens/CrearEquipoScreen";
import MensajesStack from "./MensajesStack";
import { StyleSheet } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import NotificacionesScreen from "../screens/NotificacionesScreen";
import { CampeonatoContext } from "../context/CampeonatoContext";
import { NotificacionContext } from "../context/NotificacionContext";
import { ChatContext } from "../context/ChatContext";

const Drawer = createDrawerNavigator();

const headerTitle = (title, description, actionable) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <View style={{ width: actionable ? '75%' : '100%' }}>
      <Text
        style={{ fontSize: 18, fontWeight: '700' }}
        className="text-gray-900 dark:text-gray-100"
      >
        {title}
      </Text>
      <Text
        style={{ fontSize: 14 }}
        className="text-gray-600 dark:text-gray-400"
      >
        {description}
      </Text>
    </View>
    <View style={{ width: '25%' }}>
      {actionable && actionable()}
    </View>
  </View>
);

export default function DrawerNavigator() {
  const { logout } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { loading, refreshCampeonatosPublicos } = useContext(CampeonatoContext);
  const { loading: NotificacionesLoading, refreshNotificaciones, totalNotificaciones } = useContext(NotificacionContext);
  const { totalUnread } = useContext(ChatContext);

  function CustomDrawerContent(props) {
    const { logout } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);

    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flex: 1 }}
        scrollEnabled={false}
      >
        <View className={`flex-1 bg-white dark:bg-[#171717]`}>
          <DrawerItemList {...props} />
        </View>

        <View>
          <DrawerItem
            label="Cerrar sesión"
            onPress={logout}
            icon={({ size, color }) => (
              <Ionicons name="log-out-outline" size={size} color="red" />
            )}
            labelStyle={{ color: "red", fontWeight: "bold" }}
          />
        </View>
      </DrawerContentScrollView>
    );
  }

  return (
    <Drawer.Navigator
      initialRouteName="Inicio"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        sceneContainerStyle: { backgroundColor: isDarkMode ? "#171717" : "#f9fafb" },
        drawerStyle: {
          backgroundColor: isDarkMode ? "#171717" : "#f9fafb",
        },
        headerStyle: {
          backgroundColor: isDarkMode ? "#171717" : "#f9fafb",
          height: 120,
        },
        headerTintColor: isDarkMode ? "#ffffff" : "#111827",
        drawerActiveTintColor: isDarkMode ? "#3b82f6" : "#2563eb",
        drawerInactiveTintColor: isDarkMode ? "#FFFFFF" : "#6b7280",
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={HomeStack}
        screenOptions={{ headerShown: false }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Inicio",
              "Explora los campeonatos públicos disponibles",
              () => (
                <Pressable
                  className={`p-3 float-left flex-row gap-3 w-fit bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 items-center ${loading ? "opacity-50" : "opacity-100"}`}
                  onPress={async () => await refreshCampeonatosPublicos()}
                  disabled={loading}
                >
                  <Ionicons name="reload" size={25} color="#3b82f6" />
                </Pressable>
              ),
            ),
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle("Perfil", "Visualiza y edita tu información personal"),
        }}
      />
      <Drawer.Screen
        name="Crear Evento"
        component={EventoStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle("Crear evento", "Configura un nuevo campeonato"),
        }}
      />
      <Drawer.Screen
        name="Eventos"
        component={EventosStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-number-outline"
              size={size}
              color={color}
            />
          ),
          headerTitle: () =>
            headerTitle("Eventos", "Gestiona y explora tus eventos"),
        }}
      />
      <Drawer.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Calendario",
              "Visualiza tus eventos y fechas importantes",
              () => (
                <Pressable
                  className={`p-3 float-left flex-row gap-3 w-fit bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 items-center ${loading ? "opacity-50" : "opacity-100"}`}
                  onPress={async () => await refreshCampeonatosPublicos()}
                  disabled={loading}
                >
                  <Ionicons name="reload" size={25} color="#3b82f6" />
                </Pressable>
              ),
            ),
        }}
      />
      <Drawer.Screen
        name="Amigos"
        component={FriendsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Amigos",
              "Conecta con otros usuarios y comparte tus campeonatos",
            ),
        }}
      />
      <Drawer.Screen
        name="Mensajes"
        component={MensajesStack}
        options={{
          drawerLabel: ({ color }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, paddingRight: 10 }}>
              <Text style={{ color, fontWeight: '500' }}>Mensajes</Text>
              {totalUnread > 0 && (
                <View style={{ backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                </View>
              )}
            </View>
          ),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Mensajes",
              "Chatea con tus amigos y grupos de equipo",
            ),
        }}
      />
      <Drawer.Screen
        name="Equipos"
        component={EquipoStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Equipos",
              "Crea y gestiona tus equipos para los campeonatos",
            ),
        }}
      />
      <Drawer.Screen
        name="Notificaciones"
        component={NotificacionesScreen}
        options={{
          drawerLabel: ({ color }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, paddingRight: 10 }}>
              <Text style={{ color, fontWeight: '500' }}>Notificaciones</Text>
              {totalNotificaciones > 0 && (
                <View style={{ backgroundColor: '#2563eb', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{totalNotificaciones > 99 ? '99+' : totalNotificaciones}</Text>
                </View>
              )}
            </View>
          ),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Notificaciones",
              "Mantente al día con las novedades de tus campeonatos",
              () => (
                <Pressable
                  className={`p-3 float-left flex-row gap-3 w-fit bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 items-center ${loading ? "opacity-50" : "opacity-100"}`}
                  onPress={async () => await refreshNotificaciones()}
                  disabled={NotificacionesLoading}
                >
                  <Ionicons name="reload" size={25} color="#3b82f6" />
                </Pressable>
              ),
            ),

        }}
      />
      <Drawer.Screen
        name="Configuración"
        component={ConfiguracionScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerTitle: () =>
            headerTitle(
              "Configuración",
              "Personaliza tu experiencia en la aplicación",
            ),
        }}
      />
    </Drawer.Navigator>
  );
}
