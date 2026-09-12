import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config/apiConfig";

const authHeader = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

export const getEventosPublicos = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/campeonatos/publicos`,
      await authHeader(),
    );
    console.log("Respuesta de getEventosPublicos:", res.data);
    return res.data.data || [];
  } catch (error) {
    console.error(
      "Error en getEventosPublicos:",
      error.response?.status,
      error.response?.data,
    );
    if (error.response?.status === 401) {
      console.error(
        "[401] Token inválido o expirado. Verifica que estés autenticado.",
      );
    }
    return [];
  }
};

export const getMisEventos = async (userId) => {
  try {
    const res = await axios.get(
      `${API_URL}/campeonatos/propietario/${userId}`,
      await authHeader(),
    );
    console.log("Respuesta de getMisEventos:", res.data);
    if (!res.data || !res.data.data) {
      console.error("Respuesta inesperada de getMisEventos:", res.data);
      return [];
    }
    return res.data.data;
  } catch (error) {
    console.error(
      "Error en getMisEventos:",
      error.response?.status,
      error.response?.data,
    );
    if (error.response?.status === 401) {
      console.error("[401] Token inválido. Necesitas autenticarte primero.");
    }
    return [];
  }
};

export const crearEvento = async (eventoData) => {
  const res = await axios.post(
    `${API_URL}/campeonatos`,
    eventoData,
    await authHeader(),
  );
  console.log("Respuesta de crearEvento:", res.data);
  return res.data.data;
};

export const getEventoById = async (id) => {
  const res = await axios.get(
    `${API_URL}/campeonatos/${id}`,
    await authHeader(),
  );
  return res.data.data;
};

export const actualizarEvento = async (id, eventoData) => {
  const res = await axios.put(
    `${API_URL}/campeonatos/${id}`,
    eventoData,
    await authHeader(),
  );
  return res.data.data;
};

export const eliminarEvento = async (id) => {
  const res = await axios.delete(
    `${API_URL}/campeonatos/${id}`,
    await authHeader(),
  );
  return res.data.message;
};

export const getFasesService = async (campeonatoId) => {
  const res = await axios.get(`${API_URL}/fases/campeonato/${campeonatoId}`, await authHeader());
  return res.data.data;
};

export const crearFaseService = async (faseData) => {
  const res = await axios.post(`${API_URL}/fases`, faseData, await authHeader());
  return res.data.data;
};

export const eliminarFaseService = async (id) => {
  const res = await axios.delete(`${API_URL}/fases/${id}`, await authHeader());
  return res.data;
};

export const getEquiposInscritosService = async (campeonatoId) => {
  const res = await axios.get(`${API_URL}/miembros-campeonatos/${campeonatoId}`, await authHeader());
  return res.data.data;
};

export const getPartidosFaseService = async (faseId) => {
  const res = await axios.get(`${API_URL}/partidos/fase/${faseId}`, await authHeader());
  return res.data.data;
};

export const getPosicionesFaseService = async (faseId) => {
  const res = await axios.get(`${API_URL}/fases/${faseId}/posiciones`, await authHeader());
  return res.data.data;
};

export const actualizarPartidoService = async (id, data) => {
  const res = await axios.put(`${API_URL}/partidos/${id}`, data, await authHeader());
  return res.data.data;
};

export const getCampeonatosParticipando = async (userId) => {
  try {
    const res = await axios.get(
      `${API_URL}/campeonatos/participando/${userId}`,
      await authHeader(),
    );
    return res.data.data || [];
  } catch (error) {
    console.error("Error en getCampeonatosParticipando:", error);
    return [];
  }
};

export const getEscenariosService = async () => {
  const res = await axios.get(`${API_URL}/escenarios-deportivos`, await authHeader());
  return res.data.data || [];
};

export const getMisPartidosService = async () => {
  try {
    const res = await axios.get(`${API_URL}/partidos/mis-partidos`, await authHeader());
    return res.data.data || [];
  } catch (error) {
    console.error("Error en getMisPartidosService:", error);
    return [];
  }
};
