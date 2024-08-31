import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useStateUrlParams } from 'lib/useStateUrlParams';
import { useAppSelector } from 'store';
import { initialHomeSearchParamsSelector } from 'store/UI';

import HelmetTitle from '../../UI/atoms/Meta/Meta';

const NotFound = (): JSX.Element => {
  const nav = useNavigate();
  const params = useAppSelector(initialHomeSearchParamsSelector);
  const { getParamsString } = useStateUrlParams();
  return (
    <>
      <HelmetTitle
        description='REChain 404'
        ogDescription='REChain 404'
        ogTitle='REChain 404'
        title='404'
      />
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ m: '20px 0' }} variant='h3'>
          There is no such page yet
        </Typography>
        <Button
          color='secondary'
          size='large'
          variant='contained'
          onClick={() => nav(`/?${getParamsString(params)}`)}
        >
          back to safe
        </Button>
      </Box>
    </>
  );
};

export default NotFound;
