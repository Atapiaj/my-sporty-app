import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  getSolicitudesService,
  getInvitacionesService,
  responderSolicitudService,
  responderInvitacionService,
  getInvitacionesCampeonatosService,
  responderInvitacionCampeonatoService,
  getSolicitudesUnionCampeonatoService,
} from "../services/notificacionService";
import { SocketContext } from "./SocketContext";
import { showLocalNotification } from "../utils/localNotifications";
import { AuthContext } from "./AuthContext";


export const NotificacionContext = createContext();

export const NotificacionProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { usuario } = useContext(AuthContext);
  const [solicitudes, setSolicitudes] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [invitacionesCampeonato, setInvitacionesCampeonato] = useState([]);
  const [solicitudesUnion, setSolicitudesUnion] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const cargarSolicitudes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSolicitudesService();
      setSolicitudes(data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cargarInvitaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInvitacionesService();
      setInvitaciones(data);
    } catch (err) {
      console.error("Error al cargar invitaciones:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cargarInvitacionesCampeonatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInvitacionesCampeonatosService();
      setInvitacionesCampeonato(data);
    } catch (err) {
      console.error("Error al cargar invitaciones a campeonatos:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cargarSolicitudesUnion = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSolicitudesUnionCampeonatoService();
      setSolicitudesUnion(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar solicitudes de unión a campeonatos:", err);
      setSolicitudesUnion([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotificaciones = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      cargarSolicitudes(),
      cargarInvitaciones(),
      cargarInvitacionesCampeonatos(),
      cargarSolicitudesUnion(),
    ]);
    setIsLoading(false);
  }, [cargarSolicitudes, cargarInvitaciones, cargarInvitacionesCampeonatos, cargarSolicitudesUnion]);

  const responderSolicitud = useCallback(async (id, estado) => {
    setIsLoading(true);
    try {
      await responderSolicitudService(id, estado);
    } catch (err) {
      console.error("Error al responder la notificacion:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const responderInvitacion = useCallback(async (id, estado) => {
    setIsLoading(true);
    try {
      await responderInvitacionService(id, estado);
    } catch (err) {
      console.error("Error al responder la notificacion:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const responderInvitacionCampeonato = useCallback(async (id, estado) => {
    setIsLoading(true);
    try {
      await responderInvitacionCampeonatoService(id, estado);
    } catch (err) {
      console.error("Error al responder la invitacion a campeonato:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarSolicitudes();
      cargarInvitaciones();
      cargarInvitacionesCampeonatos();
      cargarSolicitudesUnion();
    }
  }, [usuario, cargarSolicitudes, cargarInvitaciones, cargarInvitacionesCampeonatos, cargarSolicitudesUnion]);

  useEffect(() => {
    if (socket) {
      const handleNuevaNotif = () => {
        console.log(
          "[Notificaciones] WebSocket ping: refrescando notificaciones",
        );
        refreshNotificaciones();
        showLocalNotification(
          "Nueva notificación",
          "Tienes una nueva solicitud de amistad, invitación o solicitud a campeonato."
        );
      };
      socket.on("nueva_notificacion", handleNuevaNotif);
      return () => {
        socket.off("nueva_notificacion", handleNuevaNotif);
      };
    }
  }, [socket, refreshNotificaciones]);

  const totalNotificaciones = useMemo(
    () =>
      (solicitudes?.length || 0) +
      (invitaciones?.length || 0) +
      (invitacionesCampeonato?.length || 0) +
      (solicitudesUnion?.length || 0),
    [solicitudes, invitaciones, invitacionesCampeonato, solicitudesUnion]
  );

  const value = useMemo(
    () => ({
      solicitudes,
      invitaciones,
      invitacionesCampeonato,
      solicitudesUnion,
      totalNotificaciones,
      cargarSolicitudes,
      cargarInvitaciones,
      cargarInvitacionesCampeonatos,
      cargarSolicitudesUnion,
      responderSolicitud,
      responderInvitacion,
      responderInvitacionCampeonato,
      refreshNotificaciones,
      isLoading,
    }),
    [
      solicitudes,
      invitaciones,
      invitacionesCampeonato,
      solicitudesUnion,
      totalNotificaciones,
      cargarSolicitudes,
      cargarInvitaciones,
      cargarInvitacionesCampeonatos,
      cargarSolicitudesUnion,
      responderSolicitud,
      responderInvitacion,
      responderInvitacionCampeonato,
      refreshNotificaciones,
      isLoading,
    ],
  );

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
};
