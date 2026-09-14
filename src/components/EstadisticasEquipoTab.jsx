import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getEstadisticasEquipoService } from "../services/equipoService";

// ── Configuración por deporte ────────────────────────────────────────────────
const SPORT_CONFIG = {
  futbol: {
    puntos: "Goles",
    puntosCorto: "G",
    favor: "Goles a Favor",
    contra: "Goles en Contra",
    favorCorto: "GF",
    contraCorto: "GC",
    promedio: "Goles / Partido",
    promedioIcon: "football-outline",
    chartLinea: "Goles por Partido",
    capIcon: "football-outline",
  },
  beisbol: {
    puntos: "Carreras",
    puntosCorto: "C",
    favor: "Carreras a Favor",
    contra: "Carreras en Contra",
    favorCorto: "CF",
    contraCorto: "CC",
    promedio: "Carreras / Partido",
    promedioIcon: "baseball-outline",
    chartLinea: "Carreras por Partido",
    capIcon: "baseball-outline",
  },
  baloncesto: {
    puntos: "Puntos",
    puntosCorto: "P",
    favor: "Puntos a Favor",
    contra: "Puntos en Contra",
    favorCorto: "PF",
    contraCorto: "PC",
    promedio: "Puntos / Partido",
    promedioIcon: "basketball-outline",
    chartLinea: "Puntos por Partido",
    capIcon: "basketball-outline",
  },
  voleibol: {
    puntos: "Sets",
    puntosCorto: "S",
    favor: "Sets Ganados",
    contra: "Sets Perdidos",
    favorCorto: "SG",
    contraCorto: "SP",
    promedio: "Sets / Partido",
    promedioIcon: "tennisball-outline",
    chartLinea: "Sets por Partido",
    capIcon: "tennisball-outline",
  },
};

const getSportConfig = (deporte) => {
  if (!deporte) return SPORT_CONFIG.futbol;
  const key = deporte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // match flexible
  if (key.includes("futbol") || key.includes("foot") || key.includes("soccer")) return SPORT_CONFIG.futbol;
  if (key.includes("beisbol") || key.includes("baseball")) return SPORT_CONFIG.beisbol;
  if (key.includes("baloncesto") || key.includes("basket")) return SPORT_CONFIG.baloncesto;
  if (key.includes("volei") || key.includes("volleyball")) return SPORT_CONFIG.voleibol;
  return SPORT_CONFIG.futbol;
};

// ────────────────────────────────────────────────────────────────────────────

export default function EstadisticasEquipoTab({ equipoId, deporte, isDarkMode }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("pie");

  const cfg = getSportConfig(deporte);

  useEffect(() => {
    fetchStats();
  }, [equipoId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getEstadisticasEquipoService(equipoId);
      if (res?.status === 200 && res?.data) {
        setStats(res.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );

  if (!stats || stats.pj === 0)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
        <Ionicons name="analytics-outline" size={48} color="#ccc" />
        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 16, fontStyle: "italic" }}>
          No hay suficientes datos para generar estadísticas aún. ¡Juega algunos partidos primero!
        </Text>
      </View>
    );

  // ── Pie / distribución ────────────────────────────────────────────────────
  const renderPieChart = () => {
    const dist = stats.distribucionResultados || [0, 0, 0];
    const total = stats.pj || 1;
    const labels = ["Victorias", "Empates", "Derrotas"];
    const colors = ["#10b981", "#6366f1", "#ef4444"];
    const icons = ["trophy-outline", "remove-outline", "close-circle-outline"];

    return (
      <View style={{ backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontWeight: "700", color: isDarkMode ? "#9ca3af" : "#111827", marginBottom: 16, fontSize: 15 }}>
          Distribución de Resultados
        </Text>
        <View style={{ flexDirection: "row", height: 28, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          {dist.map((val, i) => {
            const pct = total > 0 ? (val / total) * 100 : 0;
            if (pct === 0) return null;
            return <View key={i} style={{ width: `${pct}%`, backgroundColor: colors[i] }} />;
          })}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {dist.map((val, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors[i] + "22", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Ionicons name={icons[i]} size={18} color={colors[i]} />
              </View>
              <Text style={{ fontWeight: "800", fontSize: 20, color: isDarkMode ? "#9ca3af" : "#111827" }}>{val}</Text>
              <Text style={{ fontSize: 10, color: isDarkMode ? "#9ca3af" : "#6b7280", fontWeight: "600" }}>{labels[i]}</Text>
              <Text style={{ fontSize: 10, color: colors[i], fontWeight: "700" }}>
                {total > 0 ? ((val / total) * 100).toFixed(0) : 0}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ── Barras por partido ────────────────────────────────────────────────────
  const renderLineChart = () => {
    const data = stats.golesPorPartido || [];
    if (data.length === 0)
      return (
        <View style={{ backgroundColor: "white", borderRadius: 20, padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#9ca3af" }}>Sin datos de partidos</Text>
        </View>
      );

    const maxVal = Math.max(...data.map((d) => Math.max(d.gf || 0, d.gc || 0)), 1);
    const BAR_MAX_H = 90;

    return (
      <View style={{ backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontWeight: "700", color: isDarkMode ? "#9ca3af" : "#111827", marginBottom: 4, fontSize: 15 }}>
          {cfg.chartLinea}
        </Text>
        <Text style={{ color: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 11, marginBottom: 16 }}>
          Últimos {data.length} partidos
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, minWidth: data.length * 44, paddingBottom: 24 }}>
            {data.map((d, i) => (
              <View key={i} style={{ alignItems: "center", width: 36 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: BAR_MAX_H }}>
                  <View style={{ width: 14, height: Math.max(4, ((d.gf || 0) / maxVal) * BAR_MAX_H), backgroundColor: "#10b981", borderRadius: 4 }} />
                  <View style={{ width: 14, height: Math.max(4, ((d.gc || 0) / maxVal) * BAR_MAX_H), backgroundColor: "#ef4444", borderRadius: 4 }} />
                </View>
                <Text style={{ fontSize: 9, color: isDarkMode ? "#9ca3af" : "#6b7280", marginTop: 4 }}>{d.label || `M${i + 1}`}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#10b981", marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: isDarkMode ? "#9ca3af" : "#6b7280" }}>{cfg.favorCorto} – {cfg.favor}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#ef4444", marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: isDarkMode ? "#9ca3af" : "#6b7280" }}>{cfg.contraCorto} – {cfg.contra}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Progress bars ─────────────────────────────────────────────────────────
  const renderProgressBar = (label, val, color) => {
    const pct = Math.min(100, Math.max(0, parseFloat(val) || 0));
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: isDarkMode ? "#9ca3af" : "#6b7280" }}>{label}</Text>
          <Text style={{ fontSize: 12, fontWeight: "800", color: isDarkMode ? "#9ca3af" : "#6b7280" }}>{pct}%</Text>
        </View>
        <View style={{ height: 8, backgroundColor: isDarkMode ? "#9ca3af" : "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
          <View style={{ height: 8, width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />
        </View>
      </View>
    );
  };

  const renderProgress = () => {
    const pj = stats.pj || 1;
    return (
      <View style={{ backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontWeight: "700", color: isDarkMode ? "#9ca3af" : "#111827", marginBottom: 16, fontSize: 15 }}>
          Métricas de Rendimiento
        </Text>
        {renderProgressBar("Tasa de Victorias", ((stats.pg / pj) * 100).toFixed(0), "#10b981")}
        {renderProgressBar(`Producción Ofensiva (${cfg.favorCorto})`, ((stats.gf / (pj * 3)) * 100).toFixed(0), "#6366f1")}
        {renderProgressBar(`Solidez Defensiva (${cfg.contraCorto})`, Math.max(0, 100 - (stats.gc / pj) * 20).toFixed(0), "#ef4444")}
        {renderProgressBar("Control de Partido (Empates)", ((stats.pe / pj) * 100).toFixed(0), "#f59e0b")}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Deporte badge */}
      {deporte && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ backgroundColor: "#eef2ff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name={cfg.capIcon} size={14} color="#4f46e5" />
            <Text style={{ color: "#4f46e5", fontWeight: "700", fontSize: 12, textTransform: "capitalize" }}>{deporte}</Text>
          </View>
        </View>
      )}

      {/* KPIs */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: "#4f46e5", borderRadius: 20, padding: 18 }}>
          <Text style={{ color: "#c7d2fe", fontSize: 11, fontWeight: "600" }}>Rendimiento</Text>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{stats.rendimiento}%</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 20, padding: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ color: "#9ca3af", fontSize: 11, fontWeight: "600" }}>{cfg.promedio}</Text>
          <Text style={{ color: isDarkMode ? "white" : "#111827", fontSize: 28, fontWeight: "800" }}>{stats.promedioGoles}</Text>
        </View>
      </View>

      {/* Resumen: PJ PG PE PP GF GC */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {[
          { label: "PJ", val: stats.pj, color: "#6366f1" },
          { label: "PG", val: stats.pg, color: "#10b981" },
          { label: "PE", val: stats.pe, color: "#f59e0b" },
          { label: "PP", val: stats.pp, color: "#ef4444" },
          { label: cfg.favorCorto, val: stats.gf, color: "#3b82f6" },
          { label: cfg.contraCorto, val: stats.gc, color: "#9ca3af" },
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 14, padding: 10, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: item.color }}>{item.val}</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af", fontWeight: "700" }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Chart selector */}
      <Text style={{ color: "#9ca3af", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Gráficos de análisis
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {[
          { id: "pie", icon: "pie-chart-outline", label: "Resultados" },
          { id: "line", icon: "bar-chart-outline", label: cfg.chartLinea },
          { id: "progress", icon: "stats-chart-outline", label: "Métricas" },
        ].map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setActiveChart(c.id)}
            style={{
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, marginRight: 8,
              backgroundColor: activeChart === c.id ? "#4f46e5" : isDarkMode ? "#262626" : "#f3f4f6",
            }}
          >
            <Ionicons name={c.icon} size={14} color={activeChart === c.id ? "#fff" : isDarkMode ? "#9ca3af" : "#6b7280"} />
            <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: "700", color: activeChart === c.id ? "#fff" : isDarkMode ? "#9ca3af" : "#6b7280" }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeChart === "pie" && renderPieChart()}
      {activeChart === "line" && renderLineChart()}
      {activeChart === "progress" && renderProgress()}

      {/* Racha */}
      {stats.rachas && stats.rachas.length > 0 && (
        <View style={{ backgroundColor: isDarkMode ? "#262626" : "white", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ color: "#9ca3af", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Última Racha
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {stats.rachas.map((r, i) => (
              <View
                key={i}
                style={{
                  width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
                  backgroundColor: r === "W" ? "#10b981" : r === "D" ? "#6366f1" : "#ef4444",
                }}
              >
                <Text style={{ color: "white", fontWeight: "800", fontSize: 13 }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
