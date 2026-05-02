import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  FiZap,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiServer,
  FiDatabase,
  FiGlobe,
  FiBarChart,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiDownload,
  FiUpload,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type PerformanceTab = 'overview' | 'metrics' | 'usage' | 'optimization' | 'monitoring';

const PerformanceManagement = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('overview');
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 secondes par défaut
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simuler des métriques de performance (dans un vrai projet, cela viendrait de l'API)
  const performanceMetrics = {
    responseTime: Math.random() * 200 + 50, // 50-250ms
    serverLoad: Math.random() * 30 + 20, // 20-50%
    databaseQueries: Math.floor(Math.random() * 1000 + 500), // 500-1500
    activeUsers: Math.floor(Math.random() * 50 + 10), // 10-60
    requestsPerMinute: Math.floor(Math.random() * 200 + 100), // 100-300
    cacheHitRate: Math.random() * 20 + 75, // 75-95%
    uptime: 99.9,
    memoryUsage: Math.random() * 20 + 40, // 40-60%
    cpuUsage: Math.random() * 15 + 10, // 10-25%
  };

  // Données pour les graphiques
  const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}h`,
    responseTime: Math.random() * 200 + 50,
    requests: Math.floor(Math.random() * 200 + 100),
  }));

  const serverLoadData = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    load: Math.random() * 30 + 20,
    memory: Math.random() * 20 + 40,
    cpu: Math.random() * 15 + 10,
  }));

  // Récupérer les statistiques réelles du dashboard
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const usageData = [
    { name: 'Élèves', value: stats?.totalStudents || 0, color: '#3B82F6' },
    { name: 'Enseignants', value: stats?.totalTeachers || 0, color: '#10B981' },
    { name: 'Éducateurs', value: stats?.totalEducators || 0, color: '#8B5CF6' },
    { name: 'Parents', value: stats?.totalParents || 0, color: '#F59E0B' },
    { name: 'Administrateurs', value: 1, color: '#EF4444' },
  ];

  const optimizationData = [
    { name: 'Cache actif', value: 85, color: '#10B981' },
    { name: 'Optimisations', value: 92, color: '#3B82F6' },
    { name: 'Compression', value: 78, color: '#F59E0B' },
    { name: 'CDN', value: 65, color: '#8B5CF6' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const tabs = [
    { id: 'overview' as PerformanceTab, label: 'Vue d\'ensemble', icon: FiBarChart },
    { id: 'metrics' as PerformanceTab, label: 'Métriques', icon: FiActivity },
    { id: 'usage' as PerformanceTab, label: 'Utilisation', icon: FiUsers },
    { id: 'optimization' as PerformanceTab, label: 'Optimisation', icon: FiZap },
    { id: 'monitoring' as PerformanceTab, label: 'Monitoring', icon: FiServer },
  ];

  const getPerformanceStatus = (value: number, threshold: number, type: 'lower' | 'higher' = 'lower') => {
    if (type === 'lower') {
      return value < threshold ? 'good' : value < threshold * 1.5 ? 'warning' : 'critical';
    } else {
      return value > threshold ? 'good' : value > threshold * 0.5 ? 'warning' : 'critical';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      good: { label: 'Excellent', color: 'bg-green-100 text-green-800' },
      warning: { label: 'Attention', color: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Critique', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">Performance & Rapidité</h2>
            <p className="text-yellow-100 text-lg">
              Interface rapide et réactive pour une expérience fluide
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{performanceMetrics.uptime.toFixed(1)}%</div>
              <div className="text-sm text-yellow-100">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{performanceMetrics.responseTime.toFixed(0)}ms</div>
              <div className="text-sm text-yellow-100">Temps réponse</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{performanceMetrics.activeUsers}</div>
              <div className="text-sm text-yellow-100">Utilisateurs actifs</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Refresh Control */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLastUpdate(new Date())}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <div className="text-sm text-gray-600">
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Intervalle d'actualisation :</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value={5000}>5 secondes</option>
              <option value={10000}>10 secondes</option>
              <option value={30000}>30 secondes</option>
              <option value={60000}>1 minute</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Temps de Réponse</p>
                    <p className="text-3xl font-bold text-green-600">
                      {performanceMetrics.responseTime.toFixed(0)}ms
                    </p>
                    {getPerformanceStatus(performanceMetrics.responseTime, 200, 'lower') === 'good' ? (
                      <FiTrendingDown className="w-4 h-4 text-green-600 mt-1" />
                    ) : (
                      <FiTrendingUp className="w-4 h-4 text-red-600 mt-1" />
                    )}
                  </div>
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
                    <FiZap className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Charge Serveur</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {performanceMetrics.serverLoad.toFixed(1)}%
                    </p>
                    {getPerformanceStatus(performanceMetrics.serverLoad, 70, 'lower') === 'good' ? (
                      <FiCheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    ) : (
                      <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-1" />
                    )}
                  </div>
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FiServer className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Taux de Cache</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {performanceMetrics.cacheHitRate.toFixed(1)}%
                    </p>
                    {getPerformanceStatus(performanceMetrics.cacheHitRate, 80, 'higher') === 'good' ? (
                      <FiTrendingUp className="w-4 h-4 text-green-600 mt-1" />
                    ) : (
                      <FiTrendingDown className="w-4 h-4 text-yellow-600 mt-1" />
                    )}
                  </div>
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                    <FiDatabase className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Requêtes/min</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {performanceMetrics.requestsPerMinute}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Actif</p>
                  </div>
                  <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                    <FiActivity className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Graphiques de performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Temps de Réponse (24h)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Charge Serveur</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={serverLoadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="load" stroke="#EF4444" name="Charge" />
                    <Line type="monotone" dataKey="memory" stroke="#3B82F6" name="Mémoire" />
                    <Line type="monotone" dataKey="cpu" stroke="#10B981" name="CPU" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Temps de Réponse</h4>
                  {getStatusBadge(getPerformanceStatus(performanceMetrics.responseTime, 200, 'lower'))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Moyenne</span>
                    <span className="font-semibold">{performanceMetrics.responseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(performanceMetrics.responseTime / 500) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Objectif : &lt; 200ms</p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Utilisation CPU</h4>
                  {getStatusBadge(getPerformanceStatus(performanceMetrics.cpuUsage, 70, 'lower'))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actuel</span>
                    <span className="font-semibold">{performanceMetrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${performanceMetrics.cpuUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Objectif : &lt; 70%</p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Utilisation Mémoire</h4>
                  {getStatusBadge(getPerformanceStatus(performanceMetrics.memoryUsage, 80, 'lower'))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actuel</span>
                    <span className="font-semibold">{performanceMetrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${performanceMetrics.memoryUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Objectif : &lt; 80%</p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Requêtes Base de Données</h4>
                  {getStatusBadge('good')}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">{performanceMetrics.databaseQueries}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <FiDatabase className="w-4 h-4" />
                    <span>Optimisées</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Taux de Cache</h4>
                  {getStatusBadge(getPerformanceStatus(performanceMetrics.cacheHitRate, 80, 'higher'))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actuel</span>
                    <span className="font-semibold">{performanceMetrics.cacheHitRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${performanceMetrics.cacheHitRate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Objectif : &gt; 80%</p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Disponibilité</h4>
                  {getStatusBadge('good')}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uptime</span>
                    <span className="font-semibold">{performanceMetrics.uptime.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <FiCheckCircle className="w-4 h-4 text-green-600" />
                    <span>Système opérationnel</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Répartition des Utilisateurs</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Activité par Heure</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Statistiques d'Utilisation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiUsers className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{performanceMetrics.activeUsers}</p>
                      <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiActivity className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceMetrics.requestsPerMinute}
                      </p>
                      <p className="text-sm text-gray-600">Requêtes/minute</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiDatabase className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceMetrics.databaseQueries}
                      </p>
                      <p className="text-sm text-gray-600">Requêtes DB</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">État des Optimisations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimizationData.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <Badge className={item.value >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {item.value}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recommandations d'Optimisation</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <FiZap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Activer la compression GZIP</h4>
                    <p className="text-sm text-gray-600">
                      Réduire la taille des réponses HTTP de 60-70% pour améliorer les temps de chargement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <FiDatabase className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Optimiser les requêtes DB</h4>
                    <p className="text-sm text-gray-600">
                      Ajouter des index sur les champs fréquemment utilisés pour accélérer les recherches.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <FiServer className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Mettre en cache les données statiques</h4>
                    <p className="text-sm text-gray-600">
                      Utiliser Redis ou Memcached pour mettre en cache les données fréquemment accédées.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <FiGlobe className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Utiliser un CDN</h4>
                    <p className="text-sm text-gray-600">
                      Distribuer les assets statiques via un CDN pour réduire la latence.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">CPU</p>
                    <p className="text-3xl font-bold text-red-600">{performanceMetrics.cpuUsage.toFixed(1)}%</p>
                  </div>
                  <FiCpu className="w-8 h-8 text-red-600" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mémoire</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {performanceMetrics.memoryUsage.toFixed(1)}%
                    </p>
                  </div>
                  <FiHardDrive className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Réseau</p>
                    <p className="text-3xl font-bold text-green-600">Normal</p>
                  </div>
                  <FiWifi className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Disque</p>
                    <p className="text-3xl font-bold text-purple-600">65%</p>
                  </div>
                  <FiDatabase className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monitoring en Temps Réel</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Temps de réponse"
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Requêtes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceManagement;






