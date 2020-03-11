import styled from 'styled-components';

export const HomePageWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  padding: 1rem 2rem;
  margin: auto;
  width: 90%;
  height: 97.5%;
  background: #e5deee;
  border: 1px solid #918a8a;
`;

export const ArticleViewSection = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;

  .article-view {
    padding: 1rem;
  }

  .moreInfo {
    display: flex;
    justify-content: space-around;
  }
`;

export const ArticleListSection = styled.section`
  flex: 0.5;
  font-size: 1.05rem;
  overflow: auto;

  h2 {
    align-self: flex-start;
    margin-left: 2rem;
  }

  .add-article-header {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .add-article-header > button {
    padding: 0.25rem;
  }

  .article-list {
    width: 95%;
  }

  .article-list > p {
    border-bottom: 1px solid rebeccapurple;
  }
`;
