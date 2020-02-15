import React from 'react';
import styled from 'styled-components';
import axios from 'axios';

const MainSection = styled.main`
  background: #352448;
  color: white;
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  margin: auto;
  width: 75%;
  
  .article-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0.5;
  }
  .article-view {
    flex: 1;
  }

  h2 {
    align-self: flex-start;
    margin-left: 2rem;
  }
`;

export default class App extends React.Component {
  static getInitialProps = async () => {
    
  }

  render() {
    return (
      <MainSection>
        <section className='article-list'>
          <h2>Your Articles</h2>
          <input type="search" placeholder="Search articles here..."/>
            <div className=''></div>
        </section>
        <section className='article-view'>
          <p>
            Sed aliquam facere tempore doloremque quia quasi earum. Nihil
            inventore quos maxime sint. Omnis dignissimos iusto nostrum ex
            omnis. Exercitationem itaque sunt nisi aut culpa dolorem. Ipsa
            blanditiis tempora laboriosam quo magni et nulla a.
          </p>
          <p>
            Ut numquam officia veniam iusto eum exercitationem natus. Fugiat et
            at ut vel placeat. Accusantium est quia quas quia doloribus
            exercitationem consequatur. Et consequatur accusantium velit
            voluptatem iste dolorem sed eum. Est repudiandae velit qui dolor sed
            accusantium et molestiae. Inventore molestias sunt et laudantium
            odit impedit.
          </p>
        </section>
      </MainSection>
    );
  }
}
