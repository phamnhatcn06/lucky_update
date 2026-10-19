<?php

class Participant extends CActiveRecord
{
    public function tableName() { return 'participants'; }

    public function rules()
    {
        return [
            ['code, full_name, department, company', 'required'],
            ['is_active', 'numerical', 'integerOnly'=>true],
            ['level', 'numerical', 'integerOnly'=>true],
            ['code', 'length', 'max'=>50],
            ['full_name, department, company', 'length', 'max'=>255],
        ];
    }

    public static function model($className=__CLASS__) { return parent::model($className); }
}
