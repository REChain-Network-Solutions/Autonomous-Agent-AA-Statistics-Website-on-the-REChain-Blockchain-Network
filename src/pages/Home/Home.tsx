import { FC, memo } from 'react';

import HomeDashboard from 'UI/organisms/HomeDashboard/HomeDashboard';

import HelmetTitle from '../../UI/atoms/Meta/Meta';

const Home: FC = () => (
  <>
    <HelmetTitle
      description='Autonomous Agents Statistics'
      ogDescription='Autonomous Agents Statistics'
      ogTitle='REChain'
      title='REChain | Autonomous Agents Statistics'
    />
    <HomeDashboard />
  </>
);
export default memo(Home);
