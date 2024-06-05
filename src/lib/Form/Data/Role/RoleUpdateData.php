<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\AdminUi\Form\Data\Role;

use Ibexa\Contracts\Core\Repository\Values\User\Role;

class RoleUpdateData
{
    /** @var \Ibexa\Contracts\Core\Repository\Values\User\Role */
    private $role;

    /** @var string */
    private $identifier;

    /**
     * @param \Ibexa\Contracts\Core\Repository\Values\User\Role|null $role
     */
    public function __construct(?Role $role = null)
    {
        if (null === $role) {
            return;
        }

        $this->role = $role;
        $this->identifier = $role->identifier;
    }

    /**
     * @return \Ibexa\Contracts\Core\Repository\Values\User\Role
     */
    public function getRole(): ?Role
    {
        return $this->role;
    }

    /**
     * @param \Ibexa\Contracts\Core\Repository\Values\User\Role $role
     *
     * @return RoleUpdateData
     */
    public function setRole(Role $role): self
    {
        $this->role = $role;

        return $this;
    }

    /**
     * @return string
     */
    public function getIdentifier(): ?string
    {
        return $this->identifier;
    }

    /**
     * @param string $identifier
     *
     * @return RoleUpdateData
     */
    public function setIdentifier(string $identifier): self
    {
        $this->identifier = $identifier;

        return $this;
    }
}
