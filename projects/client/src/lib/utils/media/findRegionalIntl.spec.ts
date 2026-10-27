import { setLocale } from '$lib/features/i18n/index.ts';
import type { EpisodeIntl } from '$lib/requests/models/EpisodeIntl.ts';
import type { MediaIntl } from '$lib/requests/models/MediaIntl.ts';
import { EpisodeSiloTranslationsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloTranslationsMappedMock.ts';
import { MovieHereticTranslationsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticTranslationsMappedMock.ts';
import { ShowSiloTranslationsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloTranslationsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { findRegionalIntl } from './findRegionalIntl.ts';

function omitLanguage<T extends MediaIntl | EpisodeIntl>(intl: T | undefined) {
  if (!intl) return intl;
  const { language: _language, ...rest } = intl;
  return rest;
}

describe('util: findRegionalIntl', () => {
  describe('movie media type', () => {
    const movieTranslations = Array.from(
      MovieHereticTranslationsMappedMock.values(),
    );
    const fallbackData = {
      title: 'Fallback Title',
      overview: 'Fallback overview',
      tagline: 'Fallback tagline',
    };

    it('should return english translation for en-us locale', () => {
      setLocale('en');

      const result = findRegionalIntl({
        type: 'movie',
        translations: movieTranslations,
        fallback: fallbackData,
      });

      expect(result).to.deep.equal({
        ...omitLanguage(MovieHereticTranslationsMappedMock.get('en')),
        title: fallbackData.title,
      });
    });

    it('should return fallback data when no translation matches the locale', () => {
      setLocale('en');

      const result = findRegionalIntl({
        type: 'movie',
        translations: movieTranslations.filter((intl) =>
          intl.language !== 'en'
        ),
        fallback: fallbackData,
      });

      expect(result).to.deep.equal({
        title: fallbackData.title,
        overview: fallbackData.overview,
        tagline: fallbackData.tagline,
        country: '',
      });
    });

    it('should borrow title from a same-language sibling when the regional translation has it null', () => {
      setLocale('en');

      const translations: MediaIntl[] = [
        {
          country: 'fr',
          language: 'fr',
          title: 'Hérétique',
          overview: 'French overview.',
          tagline: 'Remettez tout en question.',
        },
        {
          country: 'gb',
          language: 'en',
          title: 'Heretic',
          overview: 'English (GB) overview.',
          tagline: 'Question everything.',
        },
        {
          country: 'us',
          language: 'en',
          title: null,
          overview: 'English (US) overview.',
          tagline: null,
        },
      ];

      const result = findRegionalIntl({
        type: 'movie',
        translations,
        fallback: fallbackData,
      });

      expect(result).to.deep.equal({
        title: 'Heretic',
        overview: 'English (US) overview.',
        tagline: 'Question everything.',
        country: 'us',
      });
    });
  });

  describe('show media type', () => {
    const showTranslations = Array.from(
      ShowSiloTranslationsMappedMock.values(),
    );
    const fallbackData = {
      title: 'Fallback Show Title',
      overview: 'Fallback show overview',
      tagline: 'Fallback show tagline',
    };

    it('should return english translation for en-us locale', () => {
      setLocale('en');

      const result = findRegionalIntl({
        type: 'show',
        translations: showTranslations,
        fallback: fallbackData,
      });

      expect(result).to.deep.equal(
        omitLanguage(ShowSiloTranslationsMappedMock.get('en')),
      );
    });
  });

  describe('episode media type', () => {
    const episodeTranslations = Array.from(
      EpisodeSiloTranslationsMappedMock.values(),
    );
    const fallbackData = {
      title: 'Fallback Episode Title',
      overview: 'Fallback episode overview',
    };

    it('should return english translation for en-us locale', () => {
      setLocale('en');

      const result = findRegionalIntl({
        type: 'episode',
        translations: episodeTranslations,
        fallback: fallbackData,
      });

      expect(result).to.deep.equal(
        omitLanguage(EpisodeSiloTranslationsMappedMock.get('en')),
      );
    });
  });
});
