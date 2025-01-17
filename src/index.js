import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import Head from 'next/head'
import queryString from 'query-string'
import pickBy from 'lodash/pickBy'
import isEmpty from 'lodash/isEmpty'

import List from './components/List'
import Item from './components/Item'
import Link from './components/Link'
import Icon from './components/Icon'
import Select from './components/Select'

import { getSizes } from './lib/sizes'

import defaultTheme from './index.module.scss'

const getPageNumbers = ({
  currentPage,
  pageSize,
  total,
  pageNumbersToShow = 3
}) => {
  const lastPageNumber = Math.ceil(total / pageSize)
  const currentPageNumber =
    currentPage <= lastPageNumber ? currentPage : lastPageNumber
  const maxPagesBeforeCurrentPage = Math.floor(pageNumbersToShow / 2)
  const maxPagesAfterCurrentPage = Math.ceil(pageNumbersToShow / 2) - 1
  let startPage = 1
  let endPage = lastPageNumber

  if (lastPageNumber <= 1) {
    return [] // Don't show numbers if there's only 1 page
  }

  if (currentPageNumber <= maxPagesBeforeCurrentPage) {
    // near the start
    startPage = 1
    endPage = pageNumbersToShow
  } else if (currentPageNumber + maxPagesAfterCurrentPage >= lastPageNumber) {
    // near the end
    startPage = lastPageNumber - pageNumbersToShow + 1
  } else {
    // somewhere in the middle
    startPage = currentPageNumber - maxPagesBeforeCurrentPage
    endPage = currentPageNumber + maxPagesAfterCurrentPage
  }

  let pageNumbers = Array.from(Array(endPage + 1 - startPage).keys())
    .map((pageNumber) => startPage + pageNumber)
    .filter((pageNumber) => pageNumber <= lastPageNumber && pageNumber > 0)

  if (pageNumbers[0] > 1) {
    if (pageNumbers[0] <= 2) {
      pageNumbers = [1, ...pageNumbers]
    } else {
      const ellipsis = pageNumbers[0] > 3 ? '...' : 2
      pageNumbers = [1, ellipsis, ...pageNumbers]
    }
  }

  if (pageNumbers[pageNumbers.length - 1] !== lastPageNumber) {
    if (pageNumbers[pageNumbers.length - 1] === lastPageNumber - 1) {
      pageNumbers = [...pageNumbers, lastPageNumber]
    } else {
      const ellipsis =
        pageNumbers[pageNumbers.length - 1] < lastPageNumber - 2
          ? '...'
          : lastPageNumber - 1
      pageNumbers = [...pageNumbers, ellipsis, lastPageNumber]
    }
  }

  return pageNumbers
}

const Pagination = ({ total, theme, sizes }) => {
  const styles = theme || defaultTheme
  const router = useRouter()
  const [hasRouter, setHasRouter] = useState(false)
  useEffect(() => {
    setHasRouter(true)
  }, [router])

  if (!hasRouter) return null
  const query = pickBy({ ...(router.query || {}) }, (q) => !isEmpty(q))
  const currentPage = Number(query.page || 1)
  // default|custom => evaluated sizes
  const cSizes = getSizes(sizes)
  const pageSize = Number(query.size) || cSizes[0]
  const isLastPage = currentPage * pageSize >= total
  const pageNumbers = getPageNumbers({ currentPage, pageSize, total })

  const path = router.pathname

  const url = (page) =>
    `?${queryString.stringify({
      ...query,
      page
    })}`

  return (
    <nav className={styles['next-pagination']} aria-label='pagination'>
      <Head>
        {/* SEO pagination helpers */}
        {currentPage !== 1 ? (
          <link rel='prev' href={`${path}${url(currentPage - 1)}`} />
        ) : null}
        {!isLastPage ? (
          <link rel='next' href={`${path}${url(currentPage + 1)}`} />
        ) : null}
      </Head>
      <List theme={styles}>
        <Item theme={styles}>
          {currentPage !== 1 ? (
            <NextLink href={url(currentPage - 1)} passHref prefetch={false}>
              <Link label='Previous page' theme={styles}>
                <Icon icon='chevron-left' />
              </Link>
            </NextLink>
          ) : (
            <Link label='No previous page available' disabled theme={styles}>
              <Icon icon='chevron-left' />
            </Link>
          )}
        </Item>
        {pageNumbers.map((pageNumber, i) =>
          pageNumber === '...' ? (
            <Item key={`${pageNumber}${i}`} hellip theme={styles}>
              <Link disabled label='ellipsis' theme={styles}>
                &hellip;
              </Link>
            </Item>
          ) : (
            <Item key={pageNumber} theme={styles}>
              {pageNumber === currentPage ? (
                <Link
                  label={`Page ${pageNumber}, current page`}
                  disabled
                  current
                  theme={styles}
                >
                  {pageNumber}
                </Link>
              ) : (
                <NextLink href={url(pageNumber)} passHref prefetch={false}>
                  <Link label={`Page ${pageNumber}`} theme={styles}>
                    {pageNumber}
                  </Link>
                </NextLink>
              )}
            </Item>
          )
        )}
        <Item theme={styles}>
          {!isLastPage ? (
            <NextLink href={url(currentPage + 1)} passHref prefetch={false}>
              <Link label='Next page' theme={styles}>
                <Icon icon='chevron-right' />
              </Link>
            </NextLink>
          ) : (
            <Link label='No next page available' disabled theme={styles}>
              <Icon icon='chevron-right' />
            </Link>
          )}
        </Item>
      </List>

      <form method='GET' action='' className={styles['next-pagination__form']}>
        <input type='hidden' name='page' value={currentPage} />
        <label
          htmlFor='next-pagination__size'
          className={styles['next-pagination__label']}
        >
          per page
        </label>
        <Select
          theme={styles}
          name='size'
          id='next-pagination__size'
          defaultValue={pageSize}
          onChange={(e) => {
            const url = `${router.pathname}?${queryString.stringify({
              ...query,
              page: 1,
              size: e.target.value
            })}`
            router.push(url)
          }}
        >
          {cSizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </Select>
        <button className={styles['next-pagination__submit']} type='submit'>
          Set page size
        </button>
      </form>
    </nav>
  )
}

Pagination.propTypes = {
  total: PropTypes.number.isRequired,
  theme: PropTypes.object
}

Pagination.defaultProps = {
  total: 0
}

export default Pagination
