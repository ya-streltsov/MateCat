<?php

class Engines_Intento extends Engines_AbstractEngine
{

    protected $_config
        = array(
            'segment' => null,
            'source'  => null,
            'target'  => null,
        );

    public function __construct($engineRecord)
    {
        parent::__construct($engineRecord);
        if ($this->engineRecord->type != "MT") {
            throw new Exception("Engine {$this->engineRecord->id} is not a MT engine, found {$this->engineRecord->type} -> {$this->engineRecord->class_load}");
        }
    }

    /**
     * @param $lang
     *
     * @return mixed
     * @throws Exception
     */
    protected function _fixLangCode($lang)
    {
        $r = explode("-", strtolower(trim($lang)));

        return $r[0];
    }

    /**
     * @param $rawValue
     *
     * @return array
     */
    protected function _decode($rawValue)
    {
        $all_args = func_get_args();

        if (is_string($rawValue)) {
            $_response = json_decode($rawValue, true);
                $decoded = array(
                    'data' => array(
                        'translations' => array(
                            array('translatedText' => $this->_resetSpecialStrings($_response["results"][0]))
                        )
                    )
                );

        } else {
            if ($rawValue AND array_key_exists('responseStatus', $rawValue) AND array_key_exists('error', $rawValue) )
            {
                $_response_error= json_decode($rawValue['error']["response"],true);
                $decoded = array(
                    'error' => array(
                        'code'    =>  $_response_error['error']['code'],
                        'message' =>   $_response_error['error']['message']
                    )
                );
            }
            else{
                $decoded = array(
                    'error' => array(
                        'code'    => '-1',
                        'message' => ''
                    )
                );
            }

        }

        $mt_result = new Engines_Results_MT($decoded);

        if ($mt_result->error->code < 0) {
            $mt_result = $mt_result->get_as_array();
            $mt_result['error'] = (array)$mt_result['error'];
            return $mt_result;
        }

        $mt_match_res = new Engines_Results_MyMemory_Matches(
            $this->_preserveSpecialStrings($all_args[1]['context']['text']),
            $mt_result->translatedText,
            100 - $this->getPenalty() . "%",
            "MT-" . $this->getName(),
            date("Y-m-d")
        );

        $mt_res = $mt_match_res->get_as_array();

        return $mt_res;

    }

    public function get($_config)
    {
        $_config['segment'] = $this->_preserveSpecialStrings($_config['segment']);
        $_config['source'] = $this->_fixLangCode($_config['source']);
        $_config['target'] = $this->_fixLangCode($_config['target']);

        $parameters = array();
        if ($this->apikey != '' && $this->apikey != null) {
            $_headers = array('apikey: '.$this->apikey, 'Content-Type: application/json');
        }

        $parameters['context']['from'] = $_config['source'];
        $parameters['context']['to'] = $_config['target'];
        $parameters['context']['text'] = $_config['segment'];

        $this->_setAdditionalCurlParams(
            array(
                CURLOPT_POST       => true,
                CURLOPT_POSTFIELDS => json_encode($parameters),
                CURLOPT_HTTPHEADER => $_headers
            )
        );

        $this->call("translate_relative_url", $parameters, true);

        return $this->result;

    }

    public function set($_config)
    {

        //if engine does not implement SET method, exit
        return true;
    }

    public function update($config)
    {

        //if engine does not implement UPDATE method, exit
        return true;
    }

    public function delete($_config)
    {

        //if engine does not implement DELETE method, exit
        return true;

    }

}
