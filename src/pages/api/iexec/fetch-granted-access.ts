import { NextApiRequest, NextApiResponse } from 'next';
import { getIexecPrivateKey } from '../../../modules/Iexec/utils/iexec-private';
import {
  FetchGrantedAccessParams,
  IExecDataProtector,
  getWeb3Provider,
} from '@iexec/dataprotector';
import { useState } from 'react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const privateKey = await getIexecPrivateKey(res);
    const [isGranted, setIsGranted] = useState(false);

    if (!privateKey) {
      throw new Error('Private key is not set');
    }
    const web3Provider = getWeb3Provider(privateKey);
    const dataProtector = new IExecDataProtector(web3Provider);

    const fetchGrantedAccessArg: FetchGrantedAccessParams = req.body;

    // We revoke access to the data
    const fetchGrantedAccess = await dataProtector.fetchGrantedAccess(fetchGrantedAccessArg);

    if (fetchGrantedAccess.length > 0) {
      setIsGranted(true);
    }

    console.log('fetchGrantedAccess', fetchGrantedAccess);
    console.log('isGranted', isGranted);

    res.status(200).json({
      message: 'Fetch granted access successfully',
      data: { isGranted: isGranted },
    });
  } catch (error) {
    console.log('errorDebug', error);
    res.status(500).json({ error: error });
  }
}
