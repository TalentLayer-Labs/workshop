import { ISismoGroup } from '../types';
import { useContext } from 'react';
import TalentLayerContext from '../context/talentLayer';

function SismoGroupCard({
  sismoGroupData,
  userAddrss,
}: {
  sismoGroupData: ISismoGroup;
  userAddrss: string;
}) {
  const { user } = useContext(TalentLayerContext);
  const isCOnnectedUser = () => {
    return user?.address === userAddrss;
  };

  return (
    <div className='flex flex-row basis-1/4 gap-2 rounded-xl p-4 border border-gray-200 mr-4'>
      <div className='flex flex-col items-top justify-between gap-4 w-full'>
        <div className='flex flex-col justify-start items-start gap-4'>
          <div className='flex items-center justify-start'>
            <img
              src={`/default-avatar-${Number(1) % 11}.jpeg`}
              className='w-10 mr-4 rounded-full'
            />
            <div className='flex flex-col'>
              <p className='text-gray-900 font-medium'>{sismoGroupData.name}</p>
              <p className='text-xs text-gray-500'></p>
            </div>
          </div>

          <div className=' border-t border-gray-100 pt-4'>
            <p className='text-sm text-gray-500 mt-4'>
              <strong>Description:</strong> {sismoGroupData.description}
            </p>
          </div>
        </div>

        {isCOnnectedUser() && (
          <div className='flex flex-row gap-4 justify-between items-center border-t border-gray-100 pt-4'>
            <a
              className={`${
                sismoGroupData.userInGroup
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-500 hover:text-white'
                  : 'text-gray-400 bg-gray-200 pointer-events-none'
              } px-5 py-2 rounded-lg`}
              href={'https://app.sismo.io/?badge=proof-of-attendance-zk-badge'}>
              Mint Badge
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
//TODO disable when already minted

export default SismoGroupCard;
