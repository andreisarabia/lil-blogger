import Router from './Router';
import AuthRouter from './AuthRouter';
import ArticleRouter from './ArticleRouter';

export default [new AuthRouter(), new ArticleRouter()] as Router[];
