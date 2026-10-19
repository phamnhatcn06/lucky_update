<?php

class m260205_090000_add_duration_to_prizes extends CDbMigration
{
    public function up()
    {
        $this->addColumn('prizes', 'duration', 'integer DEFAULT 3000');
    }

    public function down()
    {
        $this->dropColumn('prizes', 'duration');
    }
}
