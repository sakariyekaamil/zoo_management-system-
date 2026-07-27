import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

export const ForbiddenPage = () => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">403 Forbidden</h1>
      <p className="text-gray-500 mb-6">You don't have permission to access this resource.</p>
      <Link to="/dashboard"><Button>Go to Dashboard</Button></Link>
    </div>
  </div>
);
