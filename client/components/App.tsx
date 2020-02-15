import React from 'react';
import styled from 'styled-components';

const MainSection = styled.section`
  background: blue;
  color: white;
`;

export default class App extends React.Component {
  render() {
    return (
      <MainSection>
        <h2>yeah</h2>
      </MainSection>
    );
  }
}
