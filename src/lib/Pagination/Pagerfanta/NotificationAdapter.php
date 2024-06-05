<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */

namespace Ibexa\AdminUi\Pagination\Pagerfanta;

use Ibexa\Contracts\Core\Repository\NotificationService;
use Ibexa\Contracts\Core\Repository\Values\Notification\NotificationList;
use Pagerfanta\Adapter\AdapterInterface;

/**
 * Pagerfanta adapter for Ibexa content search.
 * Will return results as notification list.
 */
class NotificationAdapter implements AdapterInterface
{
    /** @var \Ibexa\Contracts\Core\Repository\NotificationService */
    private $notificationService;

    /** @var int */
    private $nbResults;

    /**
     * @param \Ibexa\Contracts\Core\Repository\NotificationService $notificationService
     */
    public function __construct(
        NotificationService $notificationService
    ) {
        $this->notificationService = $notificationService;
    }

    /**
     * Returns the number of results.
     *
     * @return int the number of results
     */
    public function getNbResults(): int
    {
        if ($this->nbResults !== null) {
            return $this->nbResults;
        }

        return $this->nbResults = $this->notificationService->getNotificationCount();
    }

    /**
     * Returns a slice of the results.
     *
     * @param int $offset the offset
     * @param int $length the length
     *
     * @return \Ibexa\Contracts\Core\Repository\Values\Notification\NotificationList
     */
    public function getSlice($offset, $length): NotificationList
    {
        $notifications = $this->notificationService->loadNotifications($offset, $length);

        if (null === $this->nbResults) {
            $this->nbResults = $notifications->totalCount;
        }

        return $notifications;
    }
}
