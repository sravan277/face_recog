import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const analysisTypes = [
    {
      title: 'Face Analysis',
      description: 'Analyze individual faces with detailed attributes',
      type: 'face',
      icon: '👤'
    },
    {
      title: 'Group Analysis',
      description: 'Process and analyze group photos',
      type: 'group',
      icon: '👥'
    },
    {
      title: 'Crowd Analysis',
      description: 'Advanced crowd analytics and statistics',
      type: 'crowd',
      icon: '🏢'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16"
    >
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Choose Analysis Type
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {analysisTypes.map((analysis, index) => (
            <motion.div
              key={analysis.type}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/${analysis.type}`)}
              className="card cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="text-6xl mb-4">{analysis.icon}</div>
              <h2 className="text-2xl font-semibold mb-3">{analysis.title}</h2>
              <p className="text-gray-600">{analysis.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
