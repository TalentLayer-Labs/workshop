import { NextApiRequest, NextApiResponse } from 'next';
import { config } from '../../../config';
import TalentLayerID from '../../../contracts/ABI/TalentLayerID.json';
import { getDelegationSigner, isPlatformAllowedToDelegate } from '../utils/delegate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, userAddress, cid } = req.body;

  // @dev : you can add here all the checks you need to confirm the delegation for a user

  await isPlatformAllowedToDelegate(userAddress, res);

  try {
    const walletClient = await getDelegationSigner(res);

    if (!walletClient) {
      return;
    }

    const talentLayerID = new Contract(
      config.contracts.talentLayerId,
      TalentLayerID.abi,
      walletClient,
    );
    const transaction = await talentLayerID.updateProfileData(userId, cid);

    res.status(200).json({ transaction: transaction });
  } catch (error) {
    console.log('errorDebug', error);
    res.status(500).json({ error: error });
  }
}
