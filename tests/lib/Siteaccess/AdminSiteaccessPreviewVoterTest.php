<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Tests\AdminUi\Siteaccess;

use Ibexa\AdminUi\Siteaccess\AdminSiteaccessPreviewVoter;
use Ibexa\AdminUi\Siteaccess\SiteaccessPreviewVoterContext;
use Ibexa\Contracts\Core\Container\ApiLoader\RepositoryConfigurationProviderInterface;
use Ibexa\Contracts\Core\Repository\Values\Content\ContentInfo;
use Ibexa\Contracts\Core\SiteAccess\ConfigResolverInterface;
use Ibexa\Core\Repository\Values\Content\Location;
use Ibexa\Core\Repository\Values\Content\VersionInfo;
use PHPUnit\Framework\TestCase;

class AdminSiteaccessPreviewVoterTest extends TestCase
{
    private const LANGUAGE_CODE = 'eng-GB';

    /** @var \Ibexa\Contracts\Core\SiteAccess\ConfigResolverInterface&\PHPUnit\Framework\MockObject\MockObject */
    private ConfigResolverInterface $configResolver;

    /** @var \Ibexa\Contracts\Core\Container\ApiLoader\RepositoryConfigurationProviderInterface&\PHPUnit\Framework\MockObject\MockObject */
    private RepositoryConfigurationProviderInterface $repositoryConfigurationProvider;

    private AdminSiteaccessPreviewVoter $adminSiteaccessPreviewVoter;

    public function setUp(): void
    {
        $this->configResolver = $this->createMock(ConfigResolverInterface::class);
        $this->repositoryConfigurationProvider = $this->createMock(RepositoryConfigurationProviderInterface::class);

        $this->adminSiteaccessPreviewVoter = new AdminSiteaccessPreviewVoter(
            $this->configResolver,
            $this->repositoryConfigurationProvider
        );
    }

    public function testVoteWithInvalidPath(): void
    {
        $languageCode = self::LANGUAGE_CODE;
        $location = new Location(['id' => 1234, 'path' => [1]]);
        $versionInfo = new VersionInfo([
            'contentInfo' => new ContentInfo(['mainLanguageCode' => $languageCode]),
        ]);
        $siteaccess = 'site';

        $context = new SiteaccessPreviewVoterContext($location, $versionInfo, $siteaccess, $languageCode);

        $this->mockConfigMethods($context);

        self::assertFalse($this->adminSiteaccessPreviewVoter->vote($context));
    }

    /**
     * @dataProvider dataProviderForSiteaccessPreviewVoterContext
     */
    public function testVoteWithInvalidLanguageMatch(SiteaccessPreviewVoterContext $context): void
    {
        $this->mockConfigMethods($context);

        $this->repositoryConfigurationProvider
            ->expects(self::at(0))
            ->method('getDefaultRepositoryAlias')
            ->willReturn('default');

        $this->repositoryConfigurationProvider
            ->expects(self::at(1))
            ->method('getCurrentRepositoryAlias')
            ->willReturn('default');

        $this->configResolver
            ->expects(self::at(3))
            ->method('getParameter')
            ->with('repository', null, $context->getSiteaccess())
            ->willReturn(null);

        $this->configResolver
            ->expects(self::at(4))
            ->method('getParameter')
            ->with('languages', null, $context->getSiteaccess())
            ->willReturn(['ger-DE']);

        self::assertFalse($this->adminSiteaccessPreviewVoter->vote($context));
    }

    /**
     * @dataProvider dataProviderForSiteaccessPreviewVoterContext
     */
    public function testVoteWithInvalidRepositoryMatch(SiteaccessPreviewVoterContext $context): void
    {
        $this->mockConfigMethods($context);

        $this->configResolver
            ->expects(self::at(3))
            ->method('getParameter')
            ->with('repository', null, $context->getSiteaccess())
            ->willReturn(null);

        $this->repositoryConfigurationProvider
            ->expects(self::at(0))
            ->method('getDefaultRepositoryAlias')
            ->willReturn('default');

        $this->repositoryConfigurationProvider
            ->expects(self::at(1))
            ->method('getCurrentRepositoryAlias')
            ->willReturn('main');

        self::assertFalse($this->adminSiteaccessPreviewVoter->vote($context));
    }

    /**
     * @dataProvider dataProviderForSiteaccessPreviewVoterContext
     */
    public function testVoteWithValidRepositoryAndLanguageMatch(SiteaccessPreviewVoterContext $context): void
    {
        $this->mockConfigMethods($context);

        $this->configResolver
            ->expects(self::at(3))
            ->method('getParameter')
            ->with('repository', null, $context->getSiteaccess())
            ->willReturn(null);

        $this->repositoryConfigurationProvider
            ->expects(self::at(0))
            ->method('getDefaultRepositoryAlias')
            ->willReturn('default');

        $this->repositoryConfigurationProvider
            ->expects(self::at(1))
            ->method('getCurrentRepositoryAlias')
            ->willReturn('default');

        $this->configResolver
            ->expects(self::at(4))
            ->method('getParameter')
            ->with('languages', null, $context->getSiteaccess())
            ->willReturn(['eng-GB', 'fre-FR']);

        self::assertTrue($this->adminSiteaccessPreviewVoter->vote($context));
    }

    private function mockConfigMethods(SiteaccessPreviewVoterContext $context): void
    {
        $this->configResolver
            ->expects(self::at(0))
            ->method('getParameter')
            ->with('content.tree_root.location_id', null, $context->getSiteaccess())
            ->willReturn(2);

        $this->configResolver
            ->expects(self::at(1))
            ->method('getParameter')
            ->with('location_ids.media', null, $context->getSiteaccess())
            ->willReturn(43);

        $this->configResolver
            ->expects(self::at(2))
            ->method('getParameter')
            ->with('location_ids.users', null, $context->getSiteaccess())
            ->willReturn(5);
    }

    public function dataProviderForSiteaccessPreviewVoterContext(): array
    {
        $languageCode = self::LANGUAGE_CODE;
        $location = new Location(['id' => 123456, 'path' => [1, 2]]);
        $versionInfo = new VersionInfo([
            'contentInfo' => new ContentInfo(['mainLanguageCode' => $languageCode]),
        ]);
        $siteaccess = 'site';

        $context = new SiteaccessPreviewVoterContext($location, $versionInfo, $siteaccess, $languageCode);

        return [
            [
                $context,
            ],
        ];
    }
}
