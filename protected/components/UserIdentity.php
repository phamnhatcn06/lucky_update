<?php

class UserIdentity extends CUserIdentity
{
    public function authenticate()
    {
        $u = Yii::app()->params['adminUser'];
        $p = Yii::app()->params['adminPass'];

        if ($this->username !== $u) {
            $this->errorCode = self::ERROR_USERNAME_INVALID;
        } elseif ($this->password !== $p) {
            $this->errorCode = self::ERROR_PASSWORD_INVALID;
        } else {
            $this->errorCode = self::ERROR_NONE;
        }
        return !$this->errorCode;
    }
}
