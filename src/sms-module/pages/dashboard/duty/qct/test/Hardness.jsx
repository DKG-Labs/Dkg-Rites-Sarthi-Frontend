/* eslint-disable */
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { apiCall } from '../../../../../utils/CommonFunctions';

const Hardness = () => {
    const {qctId} = useParams();

    const {token} = useSelector(state => state.auth);

    const populateData = async () => {
        try{
            const {data} = await apiCall("GET", `/qct/getQctDtlByQctId?qctId=${qctId}`, token)
            
        }
        catch(error){

        }
    }

    useEffect(() => {
        populateData();
    }, [])
  return (
    <div>
      qct id: {qctId}
    </div>
  )
}

export default Hardness
