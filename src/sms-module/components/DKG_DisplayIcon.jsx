/* eslint-disable */
import React from 'react';
import { Image } from 'antd';

const DisplayIcon = ({ src, alt, width, height, className }) => (
  <Image
    width={width}
    src={src}
    height={height}
    alt={alt}
    className={className}
  />
);
export default DisplayIcon;