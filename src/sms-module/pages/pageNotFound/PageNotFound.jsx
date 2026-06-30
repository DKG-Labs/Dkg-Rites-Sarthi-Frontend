/* eslint-disable */
import React from 'react'
import { useLocation } from 'react-router-dom'

const PageNotFound = () => {
  const location = useLocation();
  return (
    <div>
      Under Construction. Path: {location.pathname}
    </div>
  )
}

export default PageNotFound
