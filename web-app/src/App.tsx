import { useEffect } from 'react';
import { useStore } from './store/useStore';
import CalendarScreen from './components/CalendarScreen';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

function App() {
  const { init, isLoading, error } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={init} />;
  }

  return <CalendarScreen />;
}

export default App;

