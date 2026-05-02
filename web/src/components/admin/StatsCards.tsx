interface StatsCardsProps {
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
    totalParents: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Élèves',
      value: stats?.totalStudents || 0,
      subtitle: `${stats?.activeStudents || 0} actifs`,
      color: 'bg-blue-500',
    },
    {
      title: 'Enseignants',
      value: stats?.totalTeachers || 0,
      color: 'bg-green-500',
    },
    {
      title: 'Classes',
      value: stats?.totalClasses || 0,
      color: 'bg-purple-500',
    },
    {
      title: 'Parents',
      value: stats?.totalParents || 0,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{card.title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
              {card.subtitle && (
                <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
              )}
            </div>
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
              <span className="text-white text-2xl">📊</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;






