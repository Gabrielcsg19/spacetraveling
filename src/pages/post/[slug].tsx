/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { v4 as uuid } from 'uuid';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>Post | spacetraveling.</title>
      </Head>
      <Header />

      <main>
        <div
          style={{
            height: '400px',
            backgroundImage: `url('${post.data.banner.url}')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center top',
          }}
        />
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                locale: ptBR,
              })}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />4 min
            </span>
          </div>
          {post.data.content.map(content => (
            <div key={uuid()} className={styles.postContent}>
              <h2>{content.heading}</h2>
              <div
                className={styles.body}
                dangerouslySetInnerHTML={{
                  __html: String(RichText.asHtml(content.body)),
                }}
              />
            </div>
          ))}
        </article>
        <Comments />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {});

  // const wordAmount = response.data.content.reduce((ac, value) => {
  //   const headingLetterAmount = value.heading.match(/\S+/g).length;
  //   const bodyLetterAmount = RichText.asText(value.body).match(/\S+/g).length;
  //   return ac + (headingLetterAmount + bodyLetterAmount);
  // }, 0);

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
