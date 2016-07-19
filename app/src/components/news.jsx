'use strict';

import React, {Component} from "react";
import home from "../../styles/index.scss";
import Header from "./header";
import Footer from "./footer";

class News extends Component {

  componentDidMount() {
    this.props.getRecentPost();
  }

  render() {
    let articles = [];
    if (this.props.recentPost) {
      articles = this.props.recentPost.posts.map(function (article) {
        return (
          <article>
            <h2>{article.title}</h2>
            <span dangerouslySetInnerHTML={{__html: article.content}}/>
          </article>
        );
      });
    }


    return <div>
      <header className={home.c_header}>
        <Header></Header>
      </header>
      <section className={home.header_home}>
        <h1>
          News
        </h1>

      </section>
      <section>
        {articles}
      </section>
      <Footer></Footer>
    </div>

  }

}

export default News;
