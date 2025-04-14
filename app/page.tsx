// Import the intermediate Client Component loader using a relative path
import DynamicHomePageLoader from './components/DynamicHomePageLoader';

export default function Page() {
  // Render the loader component, which will handle the ssr:false import
  return <DynamicHomePageLoader />;
}
