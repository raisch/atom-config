'use strict';
/* eslint-env browser, commonjs, jquery, es6 */
/* eslint-disable no-unused-vars */

import React from 'react';
import { Link } from 'react-router';

<<<<<<< HEAD
const Logo =(props)=>{
  return (
    <div className="branding">
      <a href="/">
        <img src={props.url} alt="ambi" className="img-responsive" />
      </a>
      <a href='/' className={'top-bar-nav ' + (props.currentPath === '/' && 'active')}><span></span>home</a>
      <a href='/news-feed' className={'top-bar-nav ' + (props.currentPath === '/news-feed' && 'active')}><span></span>newsfeed</a>
    </div>
  )
}
=======
const Logo = (props) => {
  return (
    <div className='branding'>
      <Link to='/'>
        <img src={props.url} alt='ambi' className='img-responsive' />
      </Link>
      <Link to='/'
        className={'top-bar-nav ' + (props.currentPath === '/' && 'active')}><span />home</Link>
      <Link to='/news-feed'
        className={'top-bar-nav ' + (props.currentPath === '/news-feed' && 'active')}><span />newsfeed</Link>
    </div>
  );
};
>>>>>>> 59e91be62b5bb707faa7969ee71379a11c762f6f
export default Logo;
