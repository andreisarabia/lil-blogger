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

const ArticleApp = props => {
  return (
    <MainSection>
      <section className='article-list'>
        <h2>Your Articles</h2>
        <input type='search' placeholder='Search articles here...' />
        <div className='articles'>{props.name}</div>
      </section>
      <section className='article-view'></section>
    </MainSection>
  );
};

export default ArticleApp;
