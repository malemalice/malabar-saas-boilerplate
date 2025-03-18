import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1">
          This is your dashboard. More features will be added soon.
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;