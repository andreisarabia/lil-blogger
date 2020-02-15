import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

const Navbar = styled.nav`
  .navlist {
    display: flex;
    justify-content: space-evenly;
  }
`;

export default class Header extends React.Component {
  render() {
    return (
      <header>
        <Navbar>
          <ul className="navlist">
            <li>
              <Link href='/'>
                <a>Home</a>
              </Link>
            </li>
            <li>
              <Link href='/settings'>
                <a>Settings</a>
              </Link>
            </li>
          </ul>
        </Navbar>
      </header>
    );
  }
}
