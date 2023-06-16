import { useWeb3Modal } from '@web3modal/react';
import { BigNumber, BigNumberish, ethers, FixedNumber } from 'ethers';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import { useProvider, useSigner } from 'wagmi';
import * as Yup from 'yup';
import TalentLayerContext from '../../context/talentLayer';
import { postToIPFS } from '../../utils/ipfs';
import { parseRateAmount } from '../../utils/web3';
import SubmitButton from './SubmitButton';
import useAllowedTokens from '../../hooks/useAllowedTokens';
import { IToken } from '../../types';
import useServiceById from '../../hooks/useServiceById';
import { SkillsInput } from './skills-input';
import { createOrUpdateService } from '../../contracts/createOrUpdateService';

interface IFormValues {
  title: string;
  about: string;
  keywords: string;
  rateToken: string;
  rateAmount: number;
  referralAmount: number;
}

function ServiceForm({ serviceId }: { serviceId?: string }) {
  const { user, account } = useContext(TalentLayerContext);
  const { data: signer } = useSigner({
    chainId: parseInt(process.env.NEXT_PUBLIC_NETWORK_ID as string),
  });
  const provider = useProvider({ chainId: parseInt(process.env.NEXT_PUBLIC_NETWORK_ID as string) });
  const { open: openConnectModal } = useWeb3Modal();
  const router = useRouter();

  const existingService = useServiceById(serviceId as string);
  const allowedTokenList = useAllowedTokens();
  const existingToken = allowedTokenList.find(value => {
    return value.address === existingService?.rateToken.address;
  });
  const [selectedToken, setSelectedToken] = useState<IToken>();
  const { isActiveDelegate } = useContext(TalentLayerContext);

  const initialValues: IFormValues = {
    title: existingService?.description?.title || '',
    about: existingService?.description?.about || '',
    keywords: existingService?.description?.keywords_raw || '',
    rateToken: existingService?.rateToken.address || '',
    rateAmount:
      existingService?.description?.rateAmount &&
      allowedTokenList &&
      existingToken &&
      existingToken.decimals
        ? Number(
            ethers.utils.formatUnits(
              BigNumber.from(existingService?.description?.rateAmount),
              existingToken.decimals,
            ),
          )
        : 0,
    referralAmount:
      existingService?.referralAmount && allowedTokenList && existingToken && existingToken.decimals
        ? Number(
            ethers.utils.formatUnits(
              BigNumber.from(existingService?.referralAmount),
              existingToken.decimals,
            ),
          )
        : 0,
  };

  const validationSchema = Yup.object({
    title: Yup.string().required('Please provide a title for your service'),
    about: Yup.string().required('Please provide a description of your service'),
    keywords: Yup.string().required('Please provide keywords for your service'),
    rateToken: Yup.string().required('Please select a payment token'),
    rateAmount: Yup.number()
      .required('Please provide an amount for your service')
      .when('rateToken', {
        is: (rateToken: string) => rateToken !== '',
        then: schema =>
          schema.moreThan(
            selectedToken
              ? FixedNumber.from(
                  ethers.utils.formatUnits(
                    selectedToken?.minimumTransactionAmount as BigNumberish,
                    selectedToken?.decimals,
                  ),
                ).toUnsafeFloat()
              : 0,
            `Amount must be greater than ${
              selectedToken
                ? FixedNumber.from(
                    ethers.utils.formatUnits(
                      selectedToken?.minimumTransactionAmount as BigNumberish,
                      selectedToken?.decimals,
                    ),
                  ).toUnsafeFloat()
                : 0
            }`,
          ),
      }),
  });

  const onSubmit = async (
    values: IFormValues,
    {
      setSubmitting,
      resetForm,
    }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void },
  ) => {
    const token = allowedTokenList.find(token => token.address === values.rateToken);
    if (account?.isConnected === true && signer && provider && token && user) {
      const parsedRateAmount = await parseRateAmount(
        values.rateAmount.toString(),
        values.rateToken,
        token.decimals,
      );
      const parsedReferralAmount = await parseRateAmount(
        values.referralAmount.toString(),
        values.rateToken,
        token.decimals,
      );
      const parsedRateAmountString = parsedRateAmount.toString();
      const cid = await postToIPFS(
        JSON.stringify({
          title: values.title,
          about: values.about,
          keywords: values.keywords,
          role: 'buyer',
          rateAmount: parsedRateAmountString,
        }),
      );
      await createOrUpdateService(
        signer,
        provider,
        router,
        user.id,
        user.address,
        existingService?.id,
        parsedReferralAmount,
        values.rateToken,
        cid,
        isActiveDelegate,
        setSubmitting,
        resetForm,
      );
    } else {
      openConnectModal();
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      onSubmit={onSubmit}
      validationSchema={validationSchema}>
      {({ isSubmitting, setFieldValue }) => (
        <Form>
          <div className='grid grid-cols-1 gap-6 border border-gray-200 rounded-md p-8'>
            <label className='block'>
              <span className='text-gray-700'>Title</span>
              <Field
                type='text'
                id='title'
                name='title'
                className='mt-1 mb-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                placeholder=''
              />
              <span className='text-red-500'>
                <ErrorMessage name='title' />
              </span>
            </label>

            <label className='block'>
              <span className='text-gray-700'>About</span>
              <Field
                as='textarea'
                id='about'
                name='about'
                className='mt-1 mb-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                placeholder=''
              />
              <span className='text-red-500'>
                <ErrorMessage name='about' />
              </span>
            </label>

            <label className='block'>
              <span className='text-gray-700'>Keywords</span>

              <SkillsInput
                initialValues={existingService?.description?.keywords_raw}
                entityId={'keywords'}
              />

              <Field type='hidden' id='keywords' name='keywords' />
            </label>

            <div className='flex'>
              <label className='block flex-1 mr-4'>
                <span className='text-gray-700'>Amount</span>
                <Field
                  type='number'
                  id='rateAmount'
                  name='rateAmount'
                  className='mt-1 mb-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                  placeholder=''
                />
                <span className='text-red-500 mt-2'>
                  <ErrorMessage name='rateAmount' />
                </span>
              </label>
              <label className='block'>
                <span className='text-gray-700'>Token</span>
                {!existingService ? (
                  <Field
                    component='select'
                    id='rateToken'
                    name='rateToken'
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                    placeholder=''
                    onChange={(e: { target: { value: string } }) => {
                      const token = allowedTokenList.find(
                        token => token.address === e.target.value,
                      );
                      setSelectedToken(token);
                      setFieldValue('rateToken', e.target.value);
                    }}>
                    <option value=''>Select a token</option>
                    {allowedTokenList.map((token, index) => (
                      <option key={index} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </Field>
                ) : (
                  <p className='my-2 block w-full text-gray-500'>
                    {existingService?.rateToken.symbol}
                  </p>
                )}
                <span className='text-red-500'>
                  <ErrorMessage name='rateToken' />
                </span>
              </label>
            </div>
            <label className='block'>
              <span className='text-gray-700'>Referral amount (Opt)</span>
              <Field
                type='number'
                id='referralAmount'
                name='referralAmount'
                className='mt-1 mb-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                placeholder=''
              />
              <span className='text-red-500'>
                <ErrorMessage name='referralAmount' />
              </span>
            </label>

            <SubmitButton isSubmitting={isSubmitting} label='Post' />
          </div>
        </Form>
      )}
    </Formik>
  );
}
export default ServiceForm;
