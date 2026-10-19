<?php

class Winner extends CActiveRecord
{
    public function tableName() { return 'winners'; }

    public function relations()
    {
        return [
            'prize' => [self::BELONGS_TO, 'Prize', 'prize_id'],
            'participant' => [self::BELONGS_TO, 'Participant', 'participant_id'],
        ];
    }

    public static function model($className=__CLASS__) { return parent::model($className); }
}
